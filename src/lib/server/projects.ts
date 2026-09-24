export type Project = {
  id: string;
  name: string;
  description: string;
  cidFile: string;
};

export const projects: Project[] = [
  {
    id: 'cyberwatch',
    name: 'CyberWatch · TheGuild',
    description: 'Curated CyberWatch content — 110 CIDs distributed across the cluster',
    cidFile: 'cyberwatch',
  },
  {
    id: 'the-arcana',
    name: 'The Arcana · Crypto Tarot',
    description: 'Curated The Arcana Crypto Tarot content — 15 CIDs',
    cidFile: 'the-arcana',
  },
  {
    id: 'async-cyberwatch',
    name: 'Async CyberWatch · TheGuild',
    description: 'Async curated CyberWatch content — 109 CIDs',
    cidFile: 'async-cyberwatch',
  },
  {
    id: 'async-first-supper',
    name: 'Async · First Supper',
    description: 'Async curated First Supper content — 115 CIDs',
    cidFile: 'async-first-supper',
  }
];

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}