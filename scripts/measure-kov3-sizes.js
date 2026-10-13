import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'projects-data');
const API = process.env.IPFS_API_URL || 'http://127.0.0.1:5001';
const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 25;
const PAUSE_MS = Number(process.env.PAUSE_MS) || 250;
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS) || 30000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function dagStatSize(cid) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API}/api/v0/dag/stat?arg=${encodeURIComponent(cid)}`, {
      method: 'POST',
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split('\n').filter(Boolean);
    const last = JSON.parse(lines[lines.length - 1]);
    const size = Number(last.TotalSize);
    return Number.isFinite(size) && size > 0 ? size : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

(async () => {
  const names = [];
  for (let i = 1; i <= 8; i++) names.push(`kov3-batch-${i}-enriched.json`);
  const files = names.map((n) => path.join(dir, n));

  const cids = [];
  for (const f of files) {
    const raw = JSON.parse(fs.readFileSync(f, 'utf-8'));
    for (const cid of Object.keys(raw.entries || {})) cids.push(cid);
  }

  console.log(`Measuring ${cids.length} KOv3 CIDs via ${API} (batch=${BATCH_SIZE}, pause=${PAUSE_MS}ms)`);

  const sizes = {};
  let done = 0;
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < cids.length; i += BATCH_SIZE) {
    const batch = cids.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (cid) => ({ cid, size: await dagStatSize(cid) }))
    );
    for (const { cid, size } of results) {
      done++;
      if (size != null) {
        sizes[cid] = size;
        ok++;
      } else {
        fail++;
      }
    }
    process.stdout.write(`\r${done}/${cids.length} (ok=${ok} fail=${fail})   `);
    if (i + BATCH_SIZE < cids.length) await sleep(PAUSE_MS);
  }
  console.log('\nDone.');

  for (const f of files) {
    const raw = JSON.parse(fs.readFileSync(f, 'utf-8'));
    let changed = 0;
    for (const [cid, e] of Object.entries(raw.entries)) {
      const size = sizes[cid];
      if (size != null && e.size_bytes !== size) {
        e.size_bytes = size;
        e.size_mb = Math.round((size / 1e6) * 1000) / 1000;
        changed++;
      }
    }
    if (changed > 0) {
      fs.writeFileSync(f, JSON.stringify(raw, null, 2));
      console.log(`${path.basename(f)}: updated ${changed} entries`);
    }
  }
})();
