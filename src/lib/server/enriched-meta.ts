import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'projects-data');

export type EnrichedProject = {
  project: string;
  projectName: string;
  artistName?: string;
  description: string;
  image?: string;
  totalCids: number;
  totalSizeMb: number;
  totalSizeGb: number;
  artists: string[];
  attributes: Array<{ trait_type: string; value: string | number }>;
};

export type EnrichedEntry = {
  cid: string;
  nameFromCsv: string;
  sizeBytes: number | null;
  sizeMb: number | null;
  type: string;
  layerName?: string;
  optionLabel?: string;
  artist?: string;
  tokenName?: string;
};

const enrichedCache = new Map<string, { project: EnrichedProject; entries: Record<string, EnrichedEntry> }>();

export function loadEnrichedMeta(name: string): { project: EnrichedProject; entries: Record<string, EnrichedEntry> } | null {
  const cached = enrichedCache.get(name);
  if (cached) return cached;

  const path = join(dir, `${name}-enriched.json`);
  if (!existsSync(path)) {
    return null;
  }

  const text = readFileSync(path, 'utf-8');
  const raw = JSON.parse(text);

  if (!raw || typeof raw !== 'object') return null;

  const pm = raw.project_metadata ?? {};
  const asyncAttrs = pm['async-attributes'] ?? {};
  const attrs = (pm.attributes ?? []) as Array<{ trait_type: string; value: string | number }>;
  const artistNames = attrs
    .filter((a: any) => a.trait_type === 'Artist')
    .map((a: any) => String(a.value));

  const project: EnrichedProject = {
    project: raw.project ?? '',
    projectName: pm.name ?? '',
    artistName: pm.artistName ?? undefined,
    description: pm.description ?? '',
    image: pm.image ?? undefined,
    totalCids: raw.total_cids ?? 0,
    totalSizeMb: raw.total_size_mb ?? 0,
    totalSizeGb: raw.total_size_gb ?? 0,
    artists: artistNames,
    attributes: attrs,
  };

  const rawEntries = (raw.entries ?? {}) as Record<string, any>;
  const entries: Record<string, EnrichedEntry> = {};

  for (const [cid, entry] of Object.entries(rawEntries)) {
    const e = entry as any;
    const info: EnrichedEntry = {
      cid,
      nameFromCsv: e.name_from_csv ?? '',
      sizeBytes: e.size_bytes ?? null,
      sizeMb: e.size_mb ?? null,
      type: e.type ?? 'unknown',
      layerName: e.layer_name ?? e.layer_info?.name ?? undefined,
      optionLabel: e.option_label ?? undefined,
      artist: e.layer_info?.attributes?.artist ?? e.artist ?? undefined,
      tokenName: e.token_name ?? undefined,
    };
    entries[cid] = info;
  }

  const result = { project, entries };
  enrichedCache.set(name, result);
  return result;
}