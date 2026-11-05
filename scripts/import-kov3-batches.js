import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = '/Users/rudykarel/Desktop/CID export fixxes/knownorigin/KOv3/10gb_batches_enriched';
const outDir = path.join(__dirname, '..', 'projects-data');

const BATCHES = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

// Map source batch number -> app batch number (app has 1-8, these become 9-19)
const appBatchNumber = (src) => src - 2;

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

for (const srcNum of BATCHES) {
  const srcFile = fs
    .readdirSync(srcDir)
    .find((f) => new RegExp(`^kov3_batch_0*${srcNum}_`).test(f));
  if (!srcFile) {
    console.error(`Missing source for batch ${srcNum}`);
    continue;
  }

  const raw = JSON.parse(fs.readFileSync(path.join(srcDir, srcFile), 'utf-8'));
  const appNum = appBatchNumber(srcNum);
  const outName = `kov3-batch-${appNum}`;

  const entries = {};
  const csvRows = ['CID,Type,Token Name,Artist,Content Type'];

  for (const [cid, e] of Object.entries(raw)) {
    entries[cid] = {
      type: e.type ?? 'unknown',
      token_name: e.token_name ?? '',
      artist: e.artist ?? '',
      asset_type: e.asset_type ?? '',
      mime: e.mime ?? '',
      content_type: e.content_type ?? '',
      ...(e.size_bytes != null ? { size_bytes: e.size_bytes, size_mb: e.size_mb } : {}),
      ...(e.metadata_name ? { metadata_name: e.metadata_name } : {}),
      ...(e.description ? { description: e.description } : {}),
      ...(e.metadata_artist ? { metadata_artist: e.metadata_artist } : {}),
      ...(e.image_cid ? { image_cid: e.image_cid } : {}),
      ...(e.animation_cid ? { animation_cid: e.animation_cid } : {}),
      ...(e.asset_cids ? { asset_cids: e.asset_cids } : {}),
    };

    csvRows.push(
      [cid, e.type ?? '', e.token_name ?? '', e.artist ?? '', e.content_type ?? '']
        .map(csvEscape)
        .join(',')
    );
  }

  const metaCount = Object.values(entries).filter((x) => x.type === 'metadata').length;
  const assetCount = Object.values(entries).filter((x) => x.type === 'asset').length;

  const enriched = {
    project: 'KnownOrigin V3',
    project_metadata: {
      name: `KnownOrigin V3 · Batch ${appNum}`,
      description: `KnownOrigin V3 — batch ${appNum} of 19 (${Object.keys(entries).length} CIDs, ${metaCount} metadata + ${assetCount} asset entries).`,
    },
    file: srcFile,
    total_cids: Object.keys(entries).length,
    entries,
  };

  fs.writeFileSync(
    path.join(outDir, `${outName}-enriched.json`),
    JSON.stringify(enriched, null, 2) + '\n'
  );
  fs.writeFileSync(path.join(outDir, `${outName}.csv`), csvRows.join('\n') + '\n');

  console.log(
    `${outName} <- ${srcFile}: ${Object.keys(entries).length} CIDs (${metaCount} metadata, ${assetCount} asset)`
  );
}