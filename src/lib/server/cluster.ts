const API = process.env.CLUSTER_API_URL || 'http://cluster:9094';

async function get(path: string) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GET ${path}: ${res.status} ${err}`);
  }
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

async function post(path: string) {
  const res = await fetch(`${API}${path}`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`POST ${path}: ${res.status} ${err}`);
  }
  return res.json();
}

async function del(path: string) {
  const res = await fetch(`${API}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DELETE ${path}: ${res.status} ${err}`);
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

export function getId(): Promise<PeerInfo> {
  return get('/id');
}

export function getPeers(): Promise<PeerInfo> {
  return get('/peers');
}

export function getPins(): Promise<PinInfo[]> {
  return fetch(`${API}/pins`).then(async (res) => {
    const text = await res.text();
    if (!text || !text.trim()) return [];
    const first = text.trim().slice(0, 1);
    if (first === '[') {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.cid) return [parsed];
      return [];
    }
    if (first === '{') {
      const parsed = JSON.parse(text);
      if (parsed.cid) return [parsed];
      return [];
    }
    const lines = text.trim().split('\n');
    return lines.map((l) => JSON.parse(l)).filter((p) => p && p.cid);
  });
}

export function addPin(cid: string, replMin?: number, replMax?: number, name?: string): Promise<PinInfo> {
  const params = new URLSearchParams();
  if (replMin !== undefined) params.set('replication-min', String(replMin));
  if (replMax !== undefined) params.set('replication-max', String(replMax));
  if (name) params.set('name', name);
  const qs = params.toString();
  return post(`/pins/${cid}${qs ? '?' + qs : ''}`);
}

export function removePin(cid: string): Promise<PinInfo> {
  return del(`/pins/${cid}`);
}