import { getId, getPeers, getPins } from '$lib/server/cluster';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const peer = await getId();
    const peers = await getPeers();
    const pins = await getPins();

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
      peer: { id: peer.id, peername: peer.peername, ipfsId: peer.ipfs?.id, version: peer.version },
      peers: Array.isArray(peers)
        ? peers.map((p: any) => ({ id: p.id, peername: p.peername, ipfsId: p.ipfs?.id, version: p.version, addresses: p.addresses }))
        : [{ id: peers.id, peername: peers.peername, ipfsId: peers.ipfs?.id, version: peers.version, addresses: peers.addresses }],
      pinStatuses,
      pinCount: pins.length,
      statusCounts
    };
  } catch (e) {
    return { error: String(e) };
  }
};