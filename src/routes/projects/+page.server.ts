import { projects } from '$lib/server/projects';
import { loadCids } from '$lib/server/projects-data';
import { loadProjectMeta } from '$lib/server/project-meta';
import { loadEnrichedMeta, type EnrichedEntry } from '$lib/server/enriched-meta';
import { getPinStatus } from '$lib/server/cluster';
import type { PageServerLoad } from './$types';

import cyberwatchImg from '$lib/assets/cyber_watch_theguild.jpg';
import theArcanaImg from '$lib/assets/The_Arcana_crypto_tarot.jpg';
import firstSupperImg from '$lib/assets/first_supper_async.jpg';
import knownoriginV1Img from '$lib/assets/knownorigin.avif';

const projectImages: Record<string, string> = {
  'cyberwatch': cyberwatchImg,
  'the-arcana': theArcanaImg,
  'async-first-supper': firstSupperImg,
  'knownorigin-v1': knownoriginV1Img,
  'knownorigin-v2-batch-1': knownoriginV1Img,
};

export const load: PageServerLoad = async ({ url }) => {
  const activeId = url.searchParams.get('project') || projects[0].id;
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const perPage = Number(url.searchParams.get('per_page')) || 50;

  const allProjects = projects.map((p) => {
    const cids = Array.from(loadCids(p.cidFile));
    const metaMap = loadProjectMeta(p.cidFile);
    const enriched = loadEnrichedMeta(p.cidFile);

    const meta: Record<string, { artworkName: string; artist?: string; description?: string }> = {};
    for (const [cid, info] of metaMap) {
      meta[cid] = info;
    }

    const enrichedEntries: Record<string, EnrichedEntry> = {};
    if (enriched) {
      for (const [cid, entry] of Object.entries(enriched.entries)) {
        enrichedEntries[cid] = entry;
      }
    }

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      image: projectImages[p.id] ?? null,
      cids,
      meta,
      enrichedEntries,
      enrichedProject: enriched?.project ?? null,
      totalCids: cids.length,
    };
  });

  const activeProject = allProjects.find((p) => p.id === activeId);
  if (!activeProject) {
    return { projects: allProjects, activeId, page, perPage, pagedCids: [], totalPages: 0, pinStatuses: [] };
  }

  const totalPages = Math.max(1, Math.ceil(activeProject.cids.length / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const pagedCids = activeProject.cids.slice(start, start + perPage);

  const pinStatuses: (any | null)[] = [];
  const batchSize = 5;
  for (let i = 0; i < pagedCids.length; i += batchSize) {
    const batch = pagedCids.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((cid) => getPinStatus(cid).catch(() => null))
    );
    pinStatuses.push(...results);
  }

  const pinStatusMap: Record<string, { pinnedCount: number; totalPeers: number }> = {};
  for (let i = 0; i < pagedCids.length; i++) {
    const status = pinStatuses[i];
    if (status) {
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
    projects: allProjects,
    activeId,
    page: safePage,
    perPage,
    pagedCids,
    totalPages,
    pinStatusMap,
  };
};