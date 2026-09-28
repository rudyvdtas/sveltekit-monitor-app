import { projects } from '$lib/server/projects';
import { loadCids } from '$lib/server/projects-data';
import { loadProjectMeta } from '$lib/server/project-meta';
import type { PageServerLoad } from './$types';

import cyberwatchImg from '$lib/assets/cyber_watch_theguild.jpg';
import theArcanaImg from '$lib/assets/The_Arcana_crypto_tarot.jpg';
import firstSupperImg from '$lib/assets/first_supper_async.jpg';
import knownoriginV1Img from '$lib/assets/knownorigin.avif';

const projectImages: Record<string, string> = {
  'cyberwatch': cyberwatchImg,
  'the-arcana': theArcanaImg,
  'async-first-supper': firstSupperImg,
  'knownorigin-v1': knownoriginV1Img,
};

export const load: PageServerLoad = async () => {
  const projectsWithCids = projects.map((p) => {
    const cids = Array.from(loadCids(p.cidFile));
    const metaMap = loadProjectMeta(p.cidFile);
    const meta: Record<string, { artworkName: string; artist?: string; description?: string }> = {};
    for (const [cid, info] of metaMap) {
      meta[cid] = info;
    }
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      image: projectImages[p.id] ?? null,
      cids,
      meta,
    };
  });

  return { projects: projectsWithCids };
};