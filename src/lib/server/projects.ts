export type Project = {
  id: string;
  name: string;
  description: string;
  cidFile: string;
  group: string;
  image?: string;
};

export const projects: Project[] = [
  {
    id: 'async-blueprints',
    name: 'Async · Blueprints',
    group: 'async',
    description: `Async Blueprints — 47,283 CIDs · 4,337 blueprints · 135 collections · ~273.4 GB.

Every blueprint edition resolves to its artist, collection and layer traits. Data enriched with token names, artists and collection attributes.

Check the original pieces: https://async.art/`,
    cidFile: 'async-blueprints',
    image: 'async_art_logo.avif',
  },
  {
    id: 'async-nested',
    name: 'Async · Master Layers',
    group: 'async',
    description: `Full Async Art contract nested structure: master (parent) tokens and their child layers.

Every master token links to its child layers; every child resolves back to its parent artwork. Data enriched with artist names, layer/option labels and sizes.

Check the original pieces: https://async.art/`,
    cidFile: 'async-nested',
    image: 'async_art_logo.avif',
  },
  {
    id: 'knownorigin-v1',
    name: 'KnownOrigin V1',
    group: 'knownorigin',
    description: 'KnownOrigin V1 — 138 CIDs, 303 NFTs, enriched metadata with token names and artists.\n\nKNOWNORIGIN\n2018-2024\nIt\'s been an unforgettable experience. But the time has come to close the lid on KnownOrigin as an active platform, and look back on it as a lasting piece of crypto-art history.\n\nAll NFTs minted from any of the KODA contracts are safe and will live on.\n\nhttps://knownorigin.io/',
    cidFile: 'knownorigin-v1',
    image: 'knownorigin.avif',
  },
  {
    id: 'knownorigin-v2',
    name: 'KnownOrigin V2',
    group: 'knownorigin',
    description: 'KnownOrigin V2 — combined in one overview (14 batches merged, 18949 unique CIDs, ~143 GB), enriched with token names and artists.\n\nKNOWNORIGIN\n2018-2024\nIt\'s been an unforgettable experience. But the time has come to close the lid on KnownOrigin as an active platform, and look back on it as a lasting piece of crypto-art history.\n\nAll NFTs minted from any of the KODA contracts are safe and will live on.\n\nWe can\'t thank you all enough for trusting us over the years to be the place where so many crypto-artists started their journeys and continued to call home.\n\nhttps://knownorigin.io/',
    cidFile: 'kov2-combined',
    image: 'knownorigin.avif',
  },
  {
    id: 'knownorigin-v3',
    name: 'KnownOrigin V3',
    group: 'knownorigin',
    description: 'KnownOrigin V3 — combined in one overview (19 batches merged, 19021 unique CIDs), enriched with token names and artists.\n\nKNOWNORIGIN\n2018-2024\nIt\'s been an unforgettable experience. But the time has come to close the lid on KnownOrigin as an active platform, and look back on it as a lasting piece of crypto-art history.\n\nAll NFTs minted from any of the KODA contracts are safe and will live on.\n\nhttps://knownorigin.io/',
    cidFile: 'kov3-combined',
    image: 'knownorigin.avif',
  },
];

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function getProjectsByGroup(group: string): Project[] {
  return projects.filter((p) => p.group === group);
}