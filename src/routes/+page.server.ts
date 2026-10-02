import { getId, getPeers, getPins } from '$lib/server/cluster';
import { getFailedCids } from '$lib/server/failed-cids';
import { projects } from '$lib/server/projects';
import { loadCids } from '$lib/server/projects-data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const cluster = await getId();
    const peersData = await getPeers();
    const pins = await getPins();

    const cidToProject: Record<string, string> = {};
    for (const project of projects) {
      const cids = loadCids(project.cidFile);
      for (const cid of cids) {
        cidToProject[cid] = project.name;
      }
    }

    const peers = (Array.isArray(peersData) ? peersData : [peersData]).map((p: any) => ({
      peername: p.peername
    }));

    const volunteers = peers.length - 1;

    const statusCounts = { pinned: 0, pinning: 0, queued: 0, error: 0 };
    for (const pin of pins) {
      for (const info of Object.values(pin.peer_map ?? {})) {
        if (info.status === 'pinned') statusCounts.pinned++;
        else if (info.status === 'pinning') statusCounts.pinning++;
        else if (info.status === 'queued') statusCounts.queued++;
        else if (info.status.includes('error')) statusCounts.error++;
      }
    }

    const pinStatuses = pins.map((pin) => {
      const peers = Object.values(pin.peer_map ?? {});
      const pinnedCount = peers.filter((i: any) => i.status === 'pinned').length;
      return {
        cid: pin.cid,
        name: pin.name || pin.cid,
        projectName: cidToProject[pin.cid] ?? null,
        pinnedCount,
        totalPeers: peers.length,
      };
    });

    const failedCids = (await getFailedCids()).map((cid) => ({
      cid,
      projectName: cidToProject[cid] ?? null,
    }));

    return {
      cluster: { peername: cluster.peername },
      peers,
      volunteers,
      pinStatuses,
      pinCount: pins.length,
      statusCounts,
      failedCids
    };
  } catch (e) {
    console.error('Dashboard load failed', e);
    return { error: 'Cluster data temporarily unavailable' };
  }
};