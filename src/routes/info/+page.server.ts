import { getId, getPeers, getAllocations } from '$lib/server/cluster';
import { getFailedCids, getSummary } from '$lib/server/failed-cids';
import { projects } from '$lib/server/projects';
import { loadCids } from '$lib/server/projects-data';
import { loadEnrichedMeta } from '$lib/server/enriched-meta';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const allocations = await getAllocations();
    const summary = await getSummary();

    let totalActualSizeMb = 0;
    for (const project of projects) {
      const enriched = loadEnrichedMeta(project.cidFile);
      if (enriched?.project?.totalSizeMb) {
        totalActualSizeMb += enriched.project.totalSizeMb;
      }
    }

    const pinCount = allocations.length;

    const statusCounts = {
      pinned: summary?.pinned ?? 0,
      pinning: summary?.pinning ?? 0,
      queued: summary?.queued ?? 0,
      error: summary?.error ?? 0,
    };

    return {
      pinCount,
      statusCounts,
      totalActualSizeMb
    };
  } catch (e) {
    console.error('Info load failed', e);
    return { error: 'Cluster data temporarily unavailable' };
  }
};