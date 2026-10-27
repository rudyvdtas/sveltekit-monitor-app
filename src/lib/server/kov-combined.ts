import { loadCids } from './projects-data';
import { loadProjectMeta } from './project-meta';
import { loadEnrichedMeta, type EnrichedEntry } from './enriched-meta';

export type KovMeta = {
  artworkName: string;
  artist?: string;
  description?: string;
};

export type KovBatches = {
  projectName: string;
  description: string;
  totalCids: number;
  totalSizeMb: number;
  totalSizeGb: number;
  meta: Record<string, KovMeta>;
  entries: Record<string, EnrichedEntry>;
  cids: string[];
};

function batchNames(version: 'kov2' | 'kov3'): string[] {
  const count = version === 'kov2' ? 14 : 8;
  return Array.from({ length: count }, (_, i) => `${version}-batch-${i + 1}`);
}

const cache = new Map<string, KovBatches>();

export function loadKovCombined(version: 'kov2' | 'kov3'): KovBatches | null {
  const cached = cache.get(version);
  if (cached) return cached;

  const names = batchNames(version);
  const orderedCids = new Set<string>();
  const cids: string[] = [];
  const meta: Record<string, KovMeta> = {};
  const entries: Record<string, EnrichedEntry> = {};
  let totalSizeMb = 0;

  for (const name of names) {
    const batchCids = Array.from(loadCids(name));
    const batchMeta = loadProjectMeta(name);
    const enriched = loadEnrichedMeta(name);

    for (const cid of batchCids) {
      if (orderedCids.has(cid)) continue;
      orderedCids.add(cid);
      cids.push(cid);
    }

    for (const [cid, info] of batchMeta) {
      if (!meta[cid]) meta[cid] = info;
    }

    if (enriched) {
      for (const [cid, entry] of Object.entries(enriched.entries)) {
        if (!entries[cid]) {
          entries[cid] = entry;
          if (entry.sizeMb) totalSizeMb += entry.sizeMb;
        }
      }
    }
  }

  const isV2 = version === 'kov2';
  const result: KovBatches = {
    projectName: `KnownOrigin V${isV2 ? '2' : '3'}`,
    description:
      `KnownOrigin V${isV2 ? '2' : '3'} — combined in one overview (${names.length} batches merged), ` +
      `${cids.length} unique CIDs (~${(totalSizeMb / 1024).toFixed(1)} GB), enriched with token names and artists.`,
    totalCids: cids.length,
    totalSizeMb,
    totalSizeGb: totalSizeMb / 1024,
    meta,
    entries,
    cids,
  };

  cache.set(version, result);
  return result;
}