export type Project = {
  id: string;
  name: string;
  description: string;
  cidFile: string;
  image?: string;
};

export const projects: Project[] = [
  {
    id: 'cyberwatch',
    name: 'CyberWatch · TheGuild',
    description: 'Curated CyberWatch content — 110 CIDs distributed across the cluster',
    cidFile: 'cyberwatch',
    image: 'cyber_watch_theguild.jpg',
  },
  {
    id: 'the-arcana',
    name: 'The Arcana · Crypto Tarot',
    description: 'Curated The Arcana Crypto Tarot content — 15 CIDs',
    cidFile: 'the-arcana',
    image: 'The_Arcana_crypto_tarot.jpg',
  },
  {
    id: 'async-first-supper',
    name: 'Async · First Supper',
    description: 'We, cryptoartists, gather in this place to celebrate a new dawn for collaboration, creativity, and interaction between artist, collector, and art-lover alike. We hold these tokens to be self-evident, that all layers are created uniquely by individual artists, that each is endowed by their creator with specific immutable rights; that among these are state, rotation, scale, XY position, visibility, opacity, hue, and RGB. That whenever a token holder desires, it is their sole privilege to alter the value of these rights and constitute a new image. — Features 13 artists: Shortcut, Josie Bellini, BlackBoxDotArt, MLIBTY, VansDesign, Alotta Money, TwistedVacancy, Coldie, Hackatao, XCOPY, Rutger van der Tas, Matt Kane, Connie Digital. 115 CIDs across layer options and composite image.',
    cidFile: 'async-first-supper',
    image: 'first_supper_async.jpg',
  },
  {
    id: 'knownorigin-v1',
    name: 'KnownOrigin V1',
    description: 'KnownOrigin V1 Pinning Report — 303 NFTs, 84 unique metadata CIDs, 69 successful metadata, 15 failed metadata, 69 unique asset CIDs, 138 total CIDs to pin. Token coverage: 257/303 (85%).',
    cidFile: 'knownorigin-v1',
    image: 'knownorigin.avif',
  }
];

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}