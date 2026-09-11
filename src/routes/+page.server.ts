import { getId, getPeers, getPins } from '$lib/server/cluster';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const cluster = await getId();
    const peersData = await getPeers();
    const pins = await getPins();
    const peers = Array.isArray(peersData)
      ? peersData.map((p: any) => ({ id: p.id, peername: p.peername, ipfsId: p.ipfs?.id, version: p.version, addresses: p.addresses }))
      : [{ id: peersData.id, peername: peersData.peername, ipfsId: peersData.ipfs?.id, version: peersData.version, addresses: peersData.addresses }];

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

    const pinStatuses = pins.flatMap((pin) =>
      Object.entries(pin.peer_map ?? {}).map(([peerId, info]) => ({
        cid: pin.cid,
        name: pin.name || pin.cid,
        peername: info.peername,
        status: info.status,
        allocations: pin.allocations ?? [],
        replication_factor_min: pin.replication_factor_min,
        replication_factor_max: pin.replication_factor_max
      }))
    );

    return {
      cluster: { id: cluster.id, peername: cluster.peername, ipfsId: cluster.ipfs?.id, version: cluster.version },
      peers,
      volunteers,
      pinStatuses,
      pinCount: pins.length,
      statusCounts
    };
  } catch (e) {
    return { error: String(e) };
  }
};