const API = process.env.TRACKER_API_URL || 'http://tracker:9095';

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