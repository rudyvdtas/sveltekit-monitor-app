import { getPeers, getAllocations } from '$lib/server/cluster';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const peersData = await getPeers();
    const allocations = await getAllocations();
    const peers = Array.isArray(peersData) ? peersData : [peersData];
    const volunteers = Math.max(0, peers.length - 1);
    const cidCount = allocations.length;
    return { volunteers, cidCount, peerCount: peers.length };
  } catch (e) {
    console.error('Volunteer load failed', e);
    return { error: 'Cluster data temporarily unavailable', volunteers: 0, cidCount: 0, peerCount: 1 };
  }
};