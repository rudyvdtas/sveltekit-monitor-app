import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'projects-data');

const PARENT_FILE = join(dir, '1 nested_parent_enriched_metadata copy.json');
const CHILD_FILE = join(dir, '2 nested_child_enriched_metadata copy.json');
const CSV_FILE = join(dir, '3 Async-Master-Layers.csv');

export type NestedMeta = {
  artworkName: string;
  artist?: string;
  description?: string;
};

export type NestedEntry = {
  cid: string;
  nameFromCsv: string;
  sizeBytes: number | null;
  sizeMb: number | null;
  type: string;
  layerName?: string;
  optionLabel?: string;
  artist?: string;
  tokenName?: string;
  childCount?: number;
  parentNames?: string[];
};

export type NestedData = {
  projectName: string;
  description: string;
  totalCids: number;
  totalSizeMb: number;
  totalSizeGb: number;
  meta: Record<string, NestedMeta>;
  entries: Record<string, NestedEntry>;
  cids: string[];
};

type CsvRow = {
  cid: string;
  type: string;
  name: string;
  sizeBytes: number | null;
  childCount: number;
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.some((f) => f.trim() !== '')) rows.push(row);
  }
  return rows;
}

function parseCsvRows(text: string): CsvRow[] {
  const table = parseCsv(text);
  if (table.length === 0) return [];
  const header = table[0].map((h) => h.trim().toLowerCase());
  const idx = {
    cid: header.indexOf('cid'),
    type: header.indexOf('type'),
    name: header.indexOf('name'),
    size: header.indexOf('size_bytes'),
    childCount: header.indexOf('child_count'),
  };
  return table.slice(1).map((cells) => ({
    cid: (cells[idx.cid] ?? '').trim(),
    type: (cells[idx.type] ?? '').trim(),
    name: (cells[idx.name] ?? '').trim(),
    sizeBytes: cells[idx.size] ? Number(cells[idx.size]) || null : null,
    childCount: cells[idx.childCount] ? Number(cells[idx.childCount]) || 0 : 0,
  })).filter((r) => r.cid);
}

let cache: NestedData | null = null;

export function loadAsyncNested(): NestedData | null {
  if (cache) return cache;
  if (!existsSync(PARENT_FILE) || !existsSync(CHILD_FILE) || !existsSync(CSV_FILE)) {
    console.warn('Async nested data files missing');
    return null;
  }

  const parents = JSON.parse(readFileSync(PARENT_FILE, 'utf-8')) as { entries: Record<string, any> };
  const children = JSON.parse(readFileSync(CHILD_FILE, 'utf-8')) as { entries: Record<string, any> };
  const csvRows = parseCsvRows(readFileSync(CSV_FILE, 'utf-8'));

  const parentByCid = parents.entries;
  const childByCid = children.entries;

  const layerByChild: Record<string, { layerName: string; optionLabel: string }> = {};
  for (const p of Object.values(parentByCid)) {
    const layout = p.metadata?.layout ?? {};
    const layers = Array.isArray(layout.layers) ? layout.layers : [];
    for (const layer of layers) {
      const options = layer.states?.options ?? [];
      for (const opt of options) {
        if (opt.uri && !layerByChild[opt.uri]) {
          layerByChild[opt.uri] = { layerName: layer.id ?? 'Layer', optionLabel: opt.label ?? '' };
        }
      }
    }
  }

  function parentArtist(pcid: string | undefined): string | undefined {
    if (!pcid) return undefined;
    const p = parentByCid[pcid];
    return p?.metadata?.artistName ?? undefined;
  }

  const orderedCids = new Set<string>();
  const meta: Record<string, NestedMeta> = {};
  const entries: Record<string, NestedEntry> = {};
  let totalSizeMb = 0;
  let totalSizeBytes = 0;

  const csvByCid = new Map<string, CsvRow>();
  for (const row of csvRows) {
    if (!csvByCid.has(row.cid)) csvByCid.set(row.cid, row);
  }

  const orderedRowCids = csvRows.map((r) => r.cid);
  const extraCids: string[] = [];
  for (const cid of Object.keys(parentByCid)) {
    if (!orderedCids.has(cid)) extraCids.push(cid);
  }
  for (const cid of Object.keys(childByCid)) {
    if (!orderedCids.has(cid)) extraCids.push(cid);
  }

  for (const cid of [...orderedRowCids, ...extraCids]) {
    if (orderedCids.has(cid)) continue;
    orderedCids.add(cid);

    const row = csvByCid.get(cid);
    const parent = parentByCid[cid];
    const child = childByCid[cid];
    const layer = layerByChild[cid];

    const artworkName = parent?.name
      ?? child?.parent_names?.[0]
      ?? row?.name
      ?? meta[cid]?.artworkName
      ?? '';
    const artist = parent?.metadata?.artistName
      ?? parentArtist(child?.parent_cids?.[0])
      ?? undefined;
    const description = parent?.description ?? undefined;

    meta[cid] = {
      artworkName,
      artist,
      description,
    };

    let entry: NestedEntry;
    if (parent) {
      const sizeBytes = row?.sizeBytes ?? null;
      entry = {
        cid,
        nameFromCsv: row?.name ?? '',
        sizeBytes,
        sizeMb: sizeBytes != null ? sizeBytes / 1e6 : null,
        type: 'master',
        tokenName: artworkName,
        artist,
        childCount: parent.child_count ?? (Array.isArray(parent.child_cids) ? parent.child_cids.length : 0),
      };
    } else if (child) {
      entry = {
        cid,
        nameFromCsv: row?.name ?? '',
        sizeBytes: child.size_bytes ?? null,
        sizeMb: child.size_mb ?? null,
        type: 'asset',
        layerName: layer?.layerName,
        optionLabel: layer?.optionLabel,
        artist,
        tokenName: artworkName,
        parentNames: child.parent_names ?? [],
      };
    } else {
      const sizeBytes = row?.sizeBytes ?? null;
      entry = {
        cid,
        nameFromCsv: row?.name ?? '',
        sizeBytes,
        sizeMb: sizeBytes != null ? sizeBytes / 1e6 : null,
        type: row?.type ?? 'unknown',
        tokenName: artworkName,
        artist,
      };
    }

    entries[cid] = entry;
    totalSizeMb += entry.sizeMb ?? 0;
    totalSizeBytes += entry.sizeBytes ?? 0;
  }

  const totalCids = orderedCids.size;
  const result: NestedData = {
    projectName: 'Async Master Layers',
    description:
      `Full Async Art contract nested structure: ${Object.keys(parentByCid).length} master (parent) tokens, ` +
      `${Object.keys(childByCid).length} child layers, ${totalCids} unique CIDs (~${(totalSizeBytes / 1024 / 1024 / 1024).toFixed(1)} GB).`,
    totalCids,
    totalSizeMb: totalSizeMb,
    totalSizeGb: totalSizeBytes / 1024 / 1024 / 1024,
    meta,
    entries,
    cids: Array.from(orderedCids),
  };

  cache = result;
  return result;
}