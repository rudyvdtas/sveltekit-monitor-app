import { getPins } from '$lib/server/cluster';
import { projects } from '$lib/server/projects';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const pins = await getPins();
    return { projects, pins };
  } catch (e) {
    return { error: String(e), projects: [], pins: [] };
  }
};