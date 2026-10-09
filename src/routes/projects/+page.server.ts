import { projects } from '$lib/server/projects';
import { loadCids } from '$lib/server/projects-data';
import { loadProjectMeta } from '$lib/server/project-meta';
import { loadEnrichedMeta, type EnrichedEntry } from '$lib/server/enriched-meta';
import { getPinStatus } from '$lib/server/cluster';
import { getFailedCids } from '$lib/server/failed-cids';
import type { PageServerLoad } from './$types';

import cyberwatchImg from '$lib/assets/cyber_watch_theguild.jpg';
import theArcanaImg from '$lib/assets/The_Arcana_crypto_tarot.jpg';
import firstSupperImg from '$lib/assets/first_supper_async.jpg';
import knownoriginV1Img from '$lib/assets/knownorigin.avif';
import asyncLogoImg from '$lib/assets/async_art_logo.avif';

const projectImages: Record<string, string> = {
  'cyberwatch': cyberwatchImg,
  'the-arcana': theArcanaImg,
  'async-first-supper': firstSupperImg,
  'knownorigin-v1': knownoriginV1Img,
  'knownorigin-v2-batch-1': knownoriginV1Img,
  'knownorigin-v2-batch-2': knownoriginV1Img,
  'knownorigin-v2-batch-3': knownoriginV1Img,
  'knownorigin-v2-batch-4': knownoriginV1Img,
  'knownorigin-v2-batch-5': knownoriginV1Img,
};

const ENRICHED_FILE_NAMES = ['cyberwatch', 'the-arcana', 'async-first-supper', 'knownorigin-v1', 'kov2-batch-1', 'kov2-batch-2', 'kov2-batch-3', 'kov2-batch-4', 'kov2-batch-5'];

let failedCache: { cids: string[]; enriched: Record<string, EnrichedEntry>; meta: Record<string, any> } | null = null;

async function getFailedProjectData() {
  if (failedCache) return failedCache;
  const cids = await getFailedCids();
  const enriched: Record<string, EnrichedEntry> = {};
  const meta: Record<string, any> = {};
  for (const name of ENRICHED_FILE_NAMES) {
    const data = loadEnrichedMeta(name);
    if (!data) continue;
    for (const cid of cids) {
      const entry = data.entries[cid];
      if (entry) {
        enriched[cid] = entry;
        const pm = loadProjectMeta(name);
        if (pm.has(cid)) meta[cid] = pm.get(cid);
      }
    }
  }
  for (const cid of cids) {
    if (!enriched[cid]) {
      enriched[cid] = { cid, nameFromCsv: cid, sizeBytes: null, sizeMb: null, type: 'unknown' };
    }
  }
  failedCache = { cids, enriched, meta };
  return failedCache;
}

export const load: PageServerLoad = async ({ url }) => {
  const activeId = url.searchParams.get('project') || projects[0].id;
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const perPage = Number(url.searchParams.get('per_page')) || 50;

  const allProjects: any[] = [];
  for (const p of projects) {
    if (p.id === 'failed') {
      const failed = await getFailedProjectData();
      allProjects.push({
        id: p.id, name: p.name, description: p.description, group: p.group,
        image: projectImages[p.id] ?? null,
        cids: failed.cids,
        meta: failed.meta,
        enrichedEntries: failed.enriched,
        enrichedProject: null,
        totalCids: failed.cids.length,
      });
    } else {
      const cids = Array.from(loadCids(p.cidFile));
      const metaMap = loadProjectMeta(p.cidFile);
      const enriched = loadEnrichedMeta(p.cidFile);
      const meta: Record<string, { artworkName: string; artist?: string; description?: string }> = {};
      for (const [cid, info] of metaMap) meta[cid] = info;
      const enrichedEntries: Record<string, EnrichedEntry> = {};
      if (enriched) {
        for (const [cid, entry] of Object.entries(enriched.entries)) enrichedEntries[cid] = entry;
      }
      allProjects.push({
        id: p.id, name: p.name, description: p.description, group: p.group,
        image: projectImages[p.id] ?? null, cids, meta, enrichedEntries,
        enrichedProject: enriched?.project ?? null,
        totalCids: cids.length,
      });
    }
  }

  const activeProject = allProjects.find((p) => p.id === activeId);
  if (!activeProject) {
    return { projects: allProjects, activeId, page, perPage, pagedCids: [], totalPages: 0, pinStatusMap: {} };
  }

  const totalPages = Math.max(1, Math.ceil(activeProject.cids.length / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const pagedCids = activeProject.cids.slice(start, start + perPage);

  const pinStatuses: (any | null)[] = [];
  const batchSize = 5;
  for (let i = 0; i < pagedCids.length; i += batchSize) {
    const batch = pagedCids.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((cid) => getPinStatus(cid).catch(() => null)));
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
    groupLogos: {
      async: asyncLogoImg,
      knownorigin: knownoriginV1Img,
    },
  };
};