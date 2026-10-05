import { getId, getPeers, getAllocations } from '$lib/server/cluster';
import { getFailedCids, getSummary } from '$lib/server/failed-cids';
import { projects } from '$lib/server/projects';
import { loadCids } from '$lib/server/projects-data';
import { loadEnrichedMeta } from '$lib/server/enriched-meta';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const cluster = await getId();
    const peersData = await getPeers();
    const summary = await getSummary();
    const allocations = await getAllocations();

    const cidToProject: Record<string, string> = {};
    let totalActualSizeMb = 0;
    for (const project of projects) {
      const cids = loadCids(project.cidFile);
      for (const cid of cids) {
        cidToProject[cid] = project.name;
      }
      const enriched = loadEnrichedMeta(project.cidFile);
      if (enriched?.project?.totalSizeMb) {
        totalActualSizeMb += enriched.project.totalSizeMb;
      }
    }

    const peers = (Array.isArray(peersData) ? peersData : [peersData]).map((p: any) => ({
      peername: p.peername
    }));

    const volunteers = peers.length - 1;

    const pinCount = allocations.length;

    const statusCounts = {
      pinned: summary?.pinned ?? 0,
      pinning: summary?.pinning ?? 0,
      queued: summary?.queued ?? 0,
      error: summary?.error ?? 0,
    };

    const recentPins = allocations.slice(0, 10).map((a) => ({
      cid: a.cid,
      name: a.name || a.cid,
      projectName: cidToProject[a.cid] ?? null,
    }));

    const failedCids = (await getFailedCids()).map((cid) => ({
      cid,
      projectName: cidToProject[cid] ?? null,
    }));

    return {
      cluster: { peername: cluster.peername },
      peers,
      volunteers,
      recentPins,
      pinCount,
      statusCounts,
      failedCids,
      totalActualSizeMb
    };
  } catch (e) {
    console.error('Dashboard load failed', e);
    return { error: 'Cluster data temporarily unavailable' };
  }
};