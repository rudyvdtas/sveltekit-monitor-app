import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'projects-data');

const cache = new Map<string, Set<string>>();

export function loadCids(name: string): Set<string> {
  const cached = cache.get(name);
  if (cached) return cached;

  const path = join(dir, `${name}.csv`);
  if (!existsSync(path)) {
    console.warn(`Project CID file not found: ${path}`);
    return new Set();
  }

  const text = readFileSync(path, 'utf-8');
  const lines = text.trim().split('\n');
  const cids = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cid = line.split(',')[0]?.trim();
    if (cid) cids.add(cid);
  }

  cache.set(name, cids);
  return cids;
}