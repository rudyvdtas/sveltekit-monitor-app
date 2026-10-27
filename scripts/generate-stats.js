import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'projects-data');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(field); field = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some(f => f.trim() !== '')) rows.push(row);
      row = []; field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.some(f => f.trim() !== '')) rows.push(row);
  }
  return rows;
}

const seen = new Set();
let totalCids = 0;
let sizedCids = 0;
let totalBytes = 0;

// 1. All *-enriched.json files (cyberwatch, arcana, first-supper, kov2-*, kov3-*)
const enrichedFiles = fs.readdirSync(dir).filter(f => f.endsWith('-enriched.json'));
for (const f of enrichedFiles) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
  const entries = raw.entries || {};
  for (const [cid, e] of Object.entries(entries)) {
    if (seen.has(cid)) continue;
    seen.add(cid);
    totalCids++;
    if (e.size_bytes != null && Number(e.size_bytes) > 0) {
      totalBytes += Number(e.size_bytes);
      sizedCids++;
    }
  }
}

// 2. knownorigin-v1.csv (no enriched file, Size column is empty — CID-only)
const v1Csv = fs.readFileSync(path.join(dir, 'knownorigin-v1.csv'), 'utf-8');
const v1Rows = parseCsv(v1Csv);
for (let i = 1; i < v1Rows.length; i++) {
  const cid = (v1Rows[i][0] || '').trim();
  if (!cid || seen.has(cid)) continue;
  seen.add(cid);
  totalCids++;
}

// 3. Async Master Layers CSV (size_bytes per CID)
const masterLayersPath = path.join(dir, '3 Async-Master-Layers.csv');
if (fs.existsSync(masterLayersPath)) {
  const mlText = fs.readFileSync(masterLayersPath, 'utf-8');
  const mlRows = parseCsv(mlText);
  for (let i = 1; i < mlRows.length; i++) {
    const cid = (mlRows[i][0] || '').trim();
    if (!cid || seen.has(cid)) continue;
    seen.add(cid);
    totalCids++;
    const sizeBytes = Number(mlRows[i][3]) || 0;
    if (sizeBytes > 0) {
      totalBytes += sizeBytes;
      sizedCids++;
    }
  }
}

// 4. Also read parent/child enriched JSONs for any CIDs not in CSV
const nestedFiles = [
  path.join(dir, '1 nested_parent_enriched_metadata copy.json'),
  path.join(dir, '2 nested_child_enriched_metadata copy.json'),
];
for (const p of nestedFiles) {
  if (!fs.existsSync(p)) continue;
  const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
  const entries = raw.entries || {};
  for (const [cid, e] of Object.entries(entries)) {
    if (seen.has(cid)) continue;
    seen.add(cid);
    totalCids++;
    const sb = e.size_bytes ?? e.children_total_bytes ?? null;
    if (sb != null && Number(sb) > 0) {
      totalBytes += Number(sb);
      sizedCids++;
    }
  }
}

const round = (n, d = 1) => Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
const uniqueGb = totalBytes / 1e9;

const REPLICATION_FACTOR = Number(process.env.REPLICATION_FACTOR) || 2.5;

// ...

const stats = {
  updatedAt: new Date().toISOString(),
  totalCids,
  sizedCids,
  uniqueSizeGb: round(uniqueGb, 2),
  replicationFactor: REPLICATION_FACTOR,
  replicatedSizeGb: round(uniqueGb * REPLICATION_FACTOR, 2),
};

fs.writeFileSync(path.join(dir, 'stats.json'), JSON.stringify(stats, null, 2) + '\n');
console.log(JSON.stringify(stats, null, 2));