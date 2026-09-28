import { projects } from '$lib/server/projects';
import { loadCids } from '$lib/server/projects-data';
import type { PageServerLoad } from './$types';

import cyberwatchImg from '$lib/assets/cyber_watch_theguild.jpg';
import theArcanaImg from '$lib/assets/The_Arcana_crypto_tarot.jpg';
import firstSupperImg from '$lib/assets/first_supper_async.jpg';

const projectImages: Record<string, string> = {
  'cyberwatch': cyberwatchImg,
  'the-arcana': theArcanaImg,
  'async-first-supper': firstSupperImg,
};

export const load: PageServerLoad = async () => {
  const projectsWithCids = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    image: projectImages[p.id] ?? null,
    cids: Array.from(loadCids(p.cidFile)),
  }));

  return { projects: projectsWithCids };
};