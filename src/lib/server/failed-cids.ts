const API = process.env.TRACKER_API_URL || 'http://tracker:9095';

export type PinSummary = {
  pinned: number;
  pinning: number;
  queued: number;
  error: number;
  pin_count: number;
  updated: string;
};

export async function getSummary(): Promise<PinSummary | null> {
  const url = `${API}/summary`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.error(`GET ${url}: HTTP ${res.status}`);
      return null;
    }
    return await res.json() as PinSummary;
  } catch (e) {
    console.error(`GET ${url}: request failed`, e);
    return null;
  }
}

export async function getFailedCids(): Promise<string[]> {
  const url = `${API}/failed-cids`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.error(`GET ${url}: HTTP ${res.status}`);
      return [];
    }
    return await res.json() as string[];
  } catch (e) {
    console.error(`GET ${url}: request failed`, e);
    return [];
  }
}