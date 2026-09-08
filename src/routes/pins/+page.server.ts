import { getPins } from '$lib/server/cluster';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const pins = await getPins();
    return { pins };
  } catch (e) {
    return { error: String(e), pins: [] };
  }
};