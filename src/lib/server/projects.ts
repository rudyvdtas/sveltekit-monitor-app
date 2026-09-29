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
    description: `CYBER WATCH

This is the first big collab The Guild has made on Async. It is based on the famous painting The Night Watch by Rembrandt (1642). This was initiated and coordinated by Rutger van der Tas.

A total of 34 layers make this Cyber Watch containing 107 different states made by 33 artists. Some of them are very well-known and some are up and coming.

We are all familiar with the famous painting and the composition of the original work by Rembrandt, therefore this digital piece is easily readable although it is a cacophony of styles and colors.

Rutger did not want to hold back the creativity by giving a set of rules. No themes, no color palette was assigned. Just the creative flow and the story every artist wanted to tell. They had to feel the freedom to do whatever they wanted.

Every artist was supplied with a figure or piece of the surroundings in the original painting. No one was able to pick a place, a spot or character on beforehand.

After dividing the canvas into separate layers and giving them a number, an online randomizer was used to divide them. This was done three times to get three different options. After this, a vote was made to choose which of the three variations was going to be used. This was done in a special Nachtwacht Telegram group.

All artists involved worked hard on their contribution even though we have all been impacted by Covid-19 directly or indirectly.

Being in a lockdown or not free to move in the way we used too, makes this online NFT art community very important. For both artists and collectors this online realm filled our lives in so many ways.

We are the Cyber Watch.

Participating artists from background to foreground:

Sparrow, Silje Thorn, Surreal Serpentine, FtrSaroth, Loudsqueak, Lapin Mignon, Tom Abbink, Sarah Zucker, Talos, Nika Danny, Arvid Hjorth, ejthek, Benza, Legendary, Rutger van der Tas, Becca Kennedy, Shelly Soneja, Mehak Jain, Airco Caravan, pplpleasr, Fabin Rasheed, The Perfesser, Stellabelle, Matt Kane, Coldie 3D, Shinji Akhirah, Ytje Veenstra, Orabelart, Danil Pan, Jetski, Angie Taylor, SamJ Studios`,
    cidFile: 'cyberwatch',
    image: 'cyber_watch_theguild.jpg',
  },
  {
    id: 'the-arcana',
    name: 'The Arcana · Crypto Tarot',
    description: `Created by Women of Crypto Art (WoCA), bringing together 22 women cryptoartists from 13 countries, The Arcana Crypto Tarot was released on Async Art in April 2021 as the world's first fully functional Major Arcana tarot NFT. Its programmable deck generates a new random three-card reading every day at midnight UTC.`,
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