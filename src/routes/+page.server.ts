import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { PageServerLoad } from './$types';

export type Stats = {
  updatedAt: string;
  totalCids: number;
  sizedCids: number;
  uniqueSizeGb: number;
  replicationFactor: number;
  replicatedSizeGb: number;
};

export const load: PageServerLoad = async () => {
  const file = join(process.cwd(), 'projects-data', 'stats.json');
  let stats: Stats | null = null;
  if (existsSync(file)) {
    try {
      stats = JSON.parse(readFileSync(file, 'utf-8')) as Stats;
    } catch {
      stats = null;
    }
  }
  return { stats };
};
