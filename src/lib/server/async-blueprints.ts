import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'projects-data');

export type BlueprintMeta = {
  artworkName: string;
  artist?: string;
  description?: string;
};

export type BlueprintEntry = {
  cid: string;
  nameFromCsv: string;
  sizeBytes: number | null;
  sizeMb: number | null;
  type: string;
  tokenName?: string;
  artist?: string;
  collection?: string;
  assetType?: string;
};

export type BlueprintData = {
  projectName: string;
  description: string;
  totalCids: number;
  totalSizeMb: number;
  totalSizeGb: number;
  meta: Record<string, BlueprintMeta>;
  entries: Record<string, BlueprintEntry>;
  cids: string[];
};

const BATCH_COUNT = 3;

function loadCsvSizes(path: string): Map<string, number> {
  const map = new Map<string, number>();
  if (!existsSync(path)) return map;

  const text = readFileSync(path, 'utf-8');
  const lines = text.split(/\r?\n/);
  const header = (lines[0] ?? '').split(',');
  const cidIdx = header.findIndex((h) => h.trim().toLowerCase() === 'cid');
  const sizeIdx = header.findIndex((h) => h.trim().toLowerCase() === 'size_bytes');
  if (cidIdx < 0) return map;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    const cid = parts[cidIdx]?.trim();
    if (!cid) continue;
    const size = sizeIdx >= 0 ? Number(parts[sizeIdx]) : NaN;
    if (Number.isFinite(size) && size > 0) map.set(cid, size);
  }
  return map;
}

function attr(entry: any, traitType: string): string | undefined {
  const attrs = entry?.attributes;
  if (!Array.isArray(attrs)) return undefined;
  const found = attrs.find((a: any) => a?.trait_type === traitType);
  const v = found?.value;
  return v != null && String(v).trim() !== '' ? String(v) : undefined;
}

let cache: BlueprintData | null = null;

export function loadAsyncBlueprints(): BlueprintData | null {
  if (cache) return cache;

  const orderedCids: string[] = [];
  const seen = new Set<string>();
  const meta: Record<string, BlueprintMeta> = {};
  const entries: Record<string, BlueprintEntry> = {};
  let totalSizeMb = 0;

  for (let b = 1; b <= BATCH_COUNT; b++) {
    const jsonPath = join(dir, `async-blueprints-batch-${b}-enriched.json`);
    const csvPath = join(dir, `async-blueprints-batch-${b}.csv`);
    if (!existsSync(jsonPath)) continue;

    const sizes = loadCsvSizes(csvPath);
    const raw = JSON.parse(readFileSync(jsonPath, 'utf-8')) as Record<string, any>;

    for (const [cid, value] of Object.entries(raw)) {
      if (seen.has(cid)) continue;
      seen.add(cid);
      orderedCids.push(cid);

      const isObject = value != null && typeof value === 'object';
      const hasMetadata = isObject && (value.name != null || Array.isArray(value.attributes));
      const sizeBytes = sizes.get(cid) ?? null;
      const sizeMb = sizeBytes != null ? sizeBytes / 1e6 : null;

      const tokenName = hasMetadata ? value.name ?? undefined : undefined;
      const artist = hasMetadata ? attr(value, 'Artist') : undefined;
      const collection = hasMetadata ? attr(value, 'Collection') : undefined;
      const assetType = hasMetadata ? attr(value, 'Asset Type') : undefined;
      const description = hasMetadata ? value.description ?? undefined : undefined;

      meta[cid] = {
        artworkName: tokenName ?? '',
        artist,
        description,
      };

      entries[cid] = {
        cid,
        nameFromCsv: '',
        sizeBytes,
        sizeMb,
        type: hasMetadata ? 'metadata' : 'asset',
        tokenName,
        artist,
        collection,
        assetType,
      };

      if (sizeMb) totalSizeMb += sizeMb;
    }
  }

  if (orderedCids.length === 0) return null;

  const withMetadata = Object.values(entries).filter((e) => e.type === 'metadata').length;
  const collections = new Set(
    Object.values(entries).map((e) => e.collection).filter((c): c is string => !!c)
  );

  const result: BlueprintData = {
    projectName: 'Async Blueprints',
    description:
      `Async Blueprints — ${orderedCids.length} unique CIDs (${withMetadata} with metadata), ` +
      `${collections.size} collections, ~${(totalSizeMb / 1000).toFixed(1)} GB.`,
    totalCids: orderedCids.length,
    totalSizeMb,
    totalSizeGb: totalSizeMb / 1000,
    meta,
    entries,
    cids: orderedCids,
  };

  cache = result;
  return result;
}