import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'projects-data');
const REPLICATION_FACTOR = Number(process.env.REPLICATION_FACTOR) || 2.5;

function round(n, d = 1) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('-enriched.json'));

const seen = new Set();
let totalCids = 0;
let sizedCids = 0;
let totalBytes = 0;

for (const f of files) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
  const entries = raw.entries || {};
  for (const [cid, e] of Object.entries(entries)) {
    if (seen.has(cid)) continue;
    seen.add(cid);
    totalCids++;
    if (e.size_bytes != null) {
      totalBytes += Number(e.size_bytes) || 0;
      sizedCids++;
    }
  }
}

const uniqueGb = totalBytes / 1e9;
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
