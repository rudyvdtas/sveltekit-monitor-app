import { getOrSet, invalidate } from './cache';

const API = process.env.CLUSTER_API_URL || 'http://cluster:9094';

let reqId = 0;

function nextId(): string {
  reqId += 1;
  return String(reqId);
}

export class ClusterError extends Error {
  constructor(
    message: string,
    public status: number,
    public requestId: string
  ) {
    super(message);
    this.name = 'ClusterError';
  }
}

let activeRequests = 0;
let rejectedCount = 0;

async function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  const max = currentMaxConcurrentRequests();
  if (activeRequests >= max) {
    rejectedCount++;
    throw new ClusterError('Too many concurrent cluster requests', 429, nextId());
  }
  activeRequests++;
  try {
    return await fn();
  } finally {
    activeRequests--;
  }
}

function currentMaxConcurrentRequests(): number {
  return Number(process.env.MAX_CONCURRENT_CLUSTER_REQUESTS) || 5;
}

function currentCacheTtl(): number {
  return Number(process.env.CACHE_TTL_MS) || 15_000;
}

function currentTimeoutMs(): number {
  return Number(process.env.CLUSTER_TIMEOUT_MS) || 30_000;
}

function currentMaxResponseBytes(): number {
  return Number(process.env.CLUSTER_MAX_RESPONSE_BYTES) || 5 * 1024 * 1024;
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), currentTimeoutMs());
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function sanitize(message: string): string {
  return message.length > 500 ? message.slice(0, 500) + '...' : message;
}

async function get(path: string): Promise<unknown> {
  const id = nextId();
  let res: Response;
  const start = Date.now();
  try {
    res = await fetchWithTimeout(`${API}${path}`);
  } catch (e) {
    console.error(`[${id}] GET ${path}: request failed after ${Date.now() - start}ms`, e);
    throw new ClusterError('Cluster unavailable', 0, id);
  }
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    console.error(`[${id}] GET ${path}: HTTP ${res.status} after ${Date.now() - start}ms — ${sanitize(err)}`);
    throw new ClusterError('Cluster request failed', res.status, id);
  }
  const cl = res.headers.get('content-length');
  if (cl && Number(cl) > currentMaxResponseBytes()) {
    console.error(`[${id}] GET ${path}: response too large (${cl} bytes) after ${Date.now() - start}ms`);
    throw new ClusterError('Response too large', 0, id);
  }
  const text = await res.text();
  if (!text) return null;
  if (text.length > currentMaxResponseBytes()) {
    console.error(`[${id}] GET ${path}: response exceeded limit (${text.length} bytes) after ${Date.now() - start}ms`);
    throw new ClusterError('Response too large', 0, id);
  }
  const trimmed = text.trim();
  console.log(`[${id}] GET ${path}: ${text.length} bytes in ${Date.now() - start}ms`);
  if (trimmed[0] === '{') {
    const lines = trimmed.split('\n');
    if (lines.length > 1 && lines[1].startsWith('{')) {
      return lines.map((l) => JSON.parse(l));
    }
  }
  return JSON.parse(trimmed);
}

async function post(path: string): Promise<unknown> {
  const id = nextId();
  let res: Response;
  try {
    res = await fetchWithTimeout(`${API}${path}`, { method: 'POST' });
  } catch (e) {
    console.error(`[${id}] POST ${path}: request failed`, e);
    throw new ClusterError('Cluster unavailable', 0, id);
  }
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    console.error(`[${id}] POST ${path}: HTTP ${res.status} — ${sanitize(err)}`);
    throw new ClusterError('Cluster request failed', res.status, id);
  }
  return res.json();
}

async function del(path: string): Promise<unknown> {
  const id = nextId();
  let res: Response;
  try {
    res = await fetchWithTimeout(`${API}${path}`, { method: 'DELETE' });
  } catch (e) {
    console.error(`[${id}] DELETE ${path}: request failed`, e);
    throw new ClusterError('Cluster unavailable', 0, id);
  }
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    console.error(`[${id}] DELETE ${path}: HTTP ${res.status} — ${sanitize(err)}`);
    throw new ClusterError('Cluster request failed', res.status, id);
  }
  return res.json();
}

export type PeerInfo = {
  id: string;
  addresses: string[];
  cluster_peers: string[];
  version: string;
  ipfs: { id: string; addresses: string[]; error: string };
  peername: string;
};

export type PinInfo = {
  cid: string;
  name: string;
  allocations: string[];
  peer_map: Record<string, { peername: string; status: string; error: string }>;
  replication_factor_min: number;
  replication_factor_max: number;
};

const CACHE_KEY_ID = 'id';
const CACHE_KEY_PEERS = 'peers';
const CACHE_KEY_ALLOCATIONS = 'allocations';

export function getId(): Promise<PeerInfo> {
  return withConcurrencyLimit(() =>
    getOrSet(CACHE_KEY_ID, () => get('/id') as Promise<PeerInfo>, currentCacheTtl())
  );
}

export function getPeers(): Promise<PeerInfo | PeerInfo[]> {
  return withConcurrencyLimit(() =>
    getOrSet(CACHE_KEY_PEERS, () => get('/peers') as Promise<PeerInfo | PeerInfo[]>, currentCacheTtl())
  );
}

/**
 * Live per-CID redundancy status (`GET /pins/{cid}`) — cost scales with peer count,
 * not pinset size, so this stays cheap at 200K+ CIDs.
 * An unknown/unpinned CID is not an error: the cluster returns HTTP 200 with
 * `allocations: []` and every peer reporting `status: "unpinned"`.
 */
export function getPinStatus(cid: string): Promise<PinInfo> {
  return withConcurrencyLimit(() =>
    getOrSet(
      `pin:${cid}`,
      () => get(`/pins/${encodeURIComponent(cid)}`) as Promise<PinInfo>,
      currentCacheTtl()
    )
  );
}

/**
 * Lichte pinset-ophaling (`GET /allocations`) — retourneert de CID-lijst met
 * replicatiefactor en toegewezen peers, maar géén live per-peer status.
 * Schaalbaar tot 200K+ CIDs (~100MB respons is acceptabel server-side).
 * Gebruik voor overzichten en tellingen i.p.v. bulk-`/pins`.
 */
export type AllocationInfo = {
  cid: string;
  name: string;
  allocations: string[];
  replication_factor_min: number;
  replication_factor_max: number;
};

export function getAllocations(): Promise<AllocationInfo[]> {
  return withConcurrencyLimit(() =>
    getOrSet(CACHE_KEY_ALLOCATIONS, () => getAllocationsRaw(), currentCacheTtl())
  );
}

async function getAllocationsRaw(): Promise<AllocationInfo[]> {
  const data = await get('/allocations');
  if (Array.isArray(data)) return data as AllocationInfo[];
  if (data && typeof data === 'object') {
    const entries = (data as Record<string, unknown>).entries ?? (data as Record<string, unknown>).allocations;
    if (Array.isArray(entries)) return entries as AllocationInfo[];
  }
  return [];
}

export function addPin(cid: string, replMin?: number, replMax?: number, name?: string): Promise<PinInfo> {
  invalidate(CACHE_KEY_ALLOCATIONS);
  invalidate(`pin:${cid}`);
  const params = new URLSearchParams();
  if (replMin !== undefined) params.set('replication-min', String(replMin));
  if (replMax !== undefined) params.set('replication-max', String(replMax));
  if (name) params.set('name', name);
  const qs = params.toString();
  return post(`/pins/${cid}${qs ? '?' + qs : ''}`) as Promise<PinInfo>;
}

export function removePin(cid: string): Promise<PinInfo> {
  invalidate(CACHE_KEY_ALLOCATIONS);
  invalidate(`pin:${cid}`);
  return del(`/pins/${cid}`) as Promise<PinInfo>;
}

export function invalidateCache(): void {
  invalidate(CACHE_KEY_ID);
  invalidate(CACHE_KEY_PEERS);
  invalidate(CACHE_KEY_ALLOCATIONS);
}

export function getMetrics(): Record<string, number> {
  return {
    activeRequests,
    totalRejected: rejectedCount,
  };
}