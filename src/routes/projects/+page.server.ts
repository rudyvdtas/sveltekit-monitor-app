import { getPins } from '$lib/server/cluster';
import { projects } from '$lib/server/projects';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const pins = await getPins();
    return { projects, pins };
  } catch (e) {
    console.error('Projects load failed', e);
    return { error: 'Cluster data temporarily unavailable', projects: [], pins: [] };
  }
};
