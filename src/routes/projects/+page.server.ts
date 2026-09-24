import { getPins } from '$lib/server/cluster';
import { projects } from '$lib/server/projects';
import { loadCids } from '$lib/server/projects-data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const pins = await getPins();

    const cidSets: Record<string, Set<string>> = {};
    for (const project of projects) {
      cidSets[project.id] = loadCids(project.cidFile);
    }

    const safePins = pins.map((pin) => ({
      cid: pin.cid,
      name: pin.name,
      replication_factor_min: pin.replication_factor_min,
      replication_factor_max: pin.replication_factor_max,
      peer_allocations: (pin.allocations ?? []).map((peerId) => {
        const info = pin.peer_map?.[peerId];
        return info ? { peername: info.peername, status: info.status } : { peername: peerId, status: 'unknown' };
      })
    }));

    const projectPins: Record<string, typeof safePins> = {};
    for (const project of projects) {
      const cids = cidSets[project.id];
      projectPins[project.id] = safePins.filter((p) => cids.has(p.cid));
    }

    return { projects, pins: safePins, projectPins };
  } catch (e) {
    console.error('Projects load failed', e);
    return { error: 'Cluster data temporarily unavailable', projects: [], pins: [] };
  }
};