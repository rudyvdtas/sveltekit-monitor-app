import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'projects-data');

export type CidMeta = {
  artworkName: string;
  artist?: string;
  description?: string;
};

const metaCache = new Map<string, Map<string, CidMeta>>();

export function loadProjectMeta(name: string): Map<string, CidMeta> {
  const cached = metaCache.get(name);
  if (cached) return cached;

  const path = join(dir, `${name}-meta.json`);
  if (!existsSync(path)) {
    return new Map();
  }

  const text = readFileSync(path, 'utf-8');
  const raw = JSON.parse(text);
  const lookup = new Map<string, CidMeta>();

  for (const [metaCid, entry] of Object.entries(raw) as [string, any][]) {
    const meta = entry?.metadata ?? {};
    const attrs = meta?.attributes ?? {};
    const info: CidMeta = {
      artworkName: meta.name ?? 'Unknown',
      artist: attrs.artist ?? undefined,
      description: meta.description ?? undefined,
    };
    lookup.set(metaCid, info);
    for (const assetCid of (entry?.assetCids ?? [])) {
      lookup.set(assetCid, info);
    }
  }

  metaCache.set(name, lookup);
  return lookup;
}