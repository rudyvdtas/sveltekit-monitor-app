import { projects } from '$lib/server/projects';
import { loadCids } from '$lib/server/projects-data';
import { loadProjectMeta } from '$lib/server/project-meta';
import { loadEnrichedMeta, type EnrichedEntry } from '$lib/server/enriched-meta';
import { loadAsyncNested } from '$lib/server/async-nested';
import { loadAsyncBlueprints } from '$lib/server/async-blueprints';
import { loadKovCombined } from '$lib/server/kov-combined';
import { getPinStatus } from '$lib/server/cluster';
import type { PageServerLoad } from './$types';

import knownoriginV1Img from '$lib/assets/knownorigin.avif';
import asyncLogoImg from '$lib/assets/async_art_logo.avif';

const projectImages: Record<string, string> = {
  'async-blueprints': asyncLogoImg,
  'async-nested': asyncLogoImg,
  'knownorigin-v1': knownoriginV1Img,
  'knownorigin-v2': knownoriginV1Img,
  'knownorigin-v3': knownoriginV1Img,
};

type ProjectMeta = { artworkName: string; artist?: string; description?: string };

type LoadedProject =
  | { kind: 'none' }
  | {
      kind: 'loaded';
      cids: string[];
      meta: Record<string, ProjectMeta>;
      entries: Record<string, EnrichedEntry>;
      enrichedProject: unknown;
    };

function emptyLoaded(): LoadedProject {
  return { kind: 'none' };
}

function loadActiveProject(id: string): LoadedProject {
  if (id === 'async-blueprints') {
    const blueprints = loadAsyncBlueprints();
    if (!blueprints) return emptyLoaded();
    return {
      kind: 'loaded',
      cids: blueprints.cids,
      meta: blueprints.meta,
      entries: blueprints.entries,
      enrichedProject: null,
    };
  }

  if (id === 'async-nested') {
    const nested = loadAsyncNested();
    if (!nested) return emptyLoaded();
    return {
      kind: 'loaded',
      cids: nested.cids,
      meta: nested.meta,
      entries: nested.entries,
      enrichedProject: null,
    };
  }

  if (id === 'knownorigin-v2' || id === 'knownorigin-v3') {
    const combined = loadKovCombined(id === 'knownorigin-v2' ? 'kov2' : 'kov3');
    if (!combined) return emptyLoaded();
    return {
      kind: 'loaded',
      cids: combined.cids,
      meta: combined.meta,
      entries: combined.entries,
      enrichedProject: null,
    };
  }

  const project = projects.find((p) => p.id === id);
  if (!project) return emptyLoaded();

  const cids = Array.from(loadCids(project.cidFile));
  const metaMap = loadProjectMeta(project.cidFile);
  const enriched = loadEnrichedMeta(project.cidFile);

  const meta: Record<string, ProjectMeta> = {};
  for (const [cid, info] of metaMap) meta[cid] = info;

  return {
    kind: 'loaded',
    cids,
    meta,
    entries: enriched?.entries ?? {},
    enrichedProject: enriched?.project ?? null,
  };
}

export const load: PageServerLoad = async ({ url }) => {
  const activeId = url.searchParams.get('project') || projects[0].id;
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const perPage = Math.min(Math.max(Number(url.searchParams.get('per_page')) || 50, 1), 200);

  const active = loadActiveProject(activeId);

  const projectSummaries = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    group: p.group,
    image: projectImages[p.id] ?? null,
    totalCids: p.id === activeId && active.kind === 'loaded' ? active.cids.length : 0,
  }));

  const activeSummary = projectSummaries.find((p) => p.id === activeId);

  if (active.kind === 'none' || !activeSummary) {
    return {
      projects: projectSummaries,
      activeId,
      activeProject: activeSummary ?? null,
      activeDescription: activeSummary?.description ?? null,
      page,
      perPage,
      pagedCids: [],
      pagedMeta: {},
      pagedEntries: {},
      totalPages: 0,
      pinStatusMap: {},
      groupLogos: {
        async: asyncLogoImg,
        knownorigin: knownoriginV1Img,
      },
    };
  }

  const totalPages = Math.max(1, Math.ceil(active.cids.length / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const pagedCids: string[] = active.cids.slice(start, start + perPage);

  const pagedMeta: Record<string, ProjectMeta> = {};
  const pagedEntries: Record<string, EnrichedEntry> = {};
  for (const cid of pagedCids) {
    const m = active.meta[cid];
    if (m) pagedMeta[cid] = m;
    const e = active.entries[cid];
    if (e) pagedEntries[cid] = e;
  }

  const pinStatuses = await Promise.all(
    pagedCids.map((cid) => getPinStatus(cid).catch(() => null))
  );

  const pinStatusMap: Record<string, { pinnedCount: number; totalPeers: number }> = {};
  for (let i = 0; i < pagedCids.length; i++) {
    const status = pinStatuses[i];
    if (status && typeof status === 'object' && 'peer_map' in status) {
      const peers = Object.values(status.peer_map ?? {});
      pinStatusMap[pagedCids[i]] = {
        pinnedCount: peers.filter((p: any) => p.status === 'pinned').length,
        totalPeers: peers.length,
      };
    } else {
      pinStatusMap[pagedCids[i]] = { pinnedCount: 0, totalPeers: 0 };
    }
  }

  return {
    projects: projectSummaries,
    activeId,
    activeProject: activeSummary,
    activeDescription: activeSummary.description,
    page: safePage,
    perPage,
    pagedCids,
    pagedMeta,
    pagedEntries,
    totalPages,
    pinStatusMap,
    groupLogos: {
      async: asyncLogoImg,
      knownorigin: knownoriginV1Img,
    },
  };
};