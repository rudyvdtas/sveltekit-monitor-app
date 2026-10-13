import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enrichedDir = path.join(__dirname, '..', 'projects-data');
const sizesCsv = '/Users/rudykarel/Desktop/CID export fixxes/knownorigin/KOv3/kov3_sizes.csv';

console.log('Loading kov3_sizes.csv...');
const csv = fs.readFileSync(sizesCsv, 'utf-8');
const lines = csv.trim().split('\n');
const sizeMap = new Map();
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(',');
  const cid = cols[0]?.trim();
  if (!cid) continue;
  const sizeBytes = Number(cols[1]) || 0;
  const sizeMb = cols[2] ? Number(cols[2]) : null;
  sizeMap.set(cid, { sizeBytes, sizeMb });
}
console.log(`Loaded ${sizeMap.size} CID sizes`);

const names = [];
for (let i = 1; i <= 8; i++) names.push(`kov3-batch-${i}-enriched.json`);
const files = names.map((n) => path.join(enrichedDir, n));

let totalCids = 0;
let found = 0;
let missing = 0;
let totalBytes = 0;

for (const f of files) {
  const raw = JSON.parse(fs.readFileSync(f, 'utf-8'));
  let changed = 0;
  for (const [cid, e] of Object.entries(raw.entries)) {
    totalCids++;
    const s = sizeMap.get(cid);
    if (s && s.sizeBytes > 0) {
      e.size_bytes = s.sizeBytes;
      e.size_mb = s.sizeMb ?? null;
      totalBytes += s.sizeBytes;
      found++;
      changed++;
    } else {
      missing++;
    }
  }
  if (changed > 0) {
    fs.writeFileSync(f, JSON.stringify(raw, null, 2));
  }
  console.log(`${path.basename(f)}: ${changed} updated`);
}

console.log(`\nTotal CIDs: ${totalCids} | Found: ${found} | Missing: ${missing}`);
console.log(`Total bytes: ${totalBytes} (${(totalBytes / 1e9).toFixed(2)} GB)`);