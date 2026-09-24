import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPins, getId, getPeers, addPin, removePin, invalidateCache, ClusterError, getMetrics } from './cluster';
import { clearAll } from './cache';

beforeEach(() => {
  clearAll();
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const singlePinJson = JSON.stringify({
  cid: 'QmTest',
  name: 'test-pin',
  allocations: ['peer1'],
  peer_map: { peer1: { peername: 'peer1', status: 'pinned', error: '' } },
  replication_factor_min: 1,
  replication_factor_max: 3,
});

const mockPinsArray = (count: number) => {
  const pins: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    pins.push({
      cid: `QmTest${i}`,
      name: `pin-${i}`,
      allocations: ['peer1'],
      peer_map: { peer1: { peername: 'peer1', status: 'pinned', error: '' } },
      replication_factor_min: 1,
      replication_factor_max: 3,
    });
  }
  return pins;
};

function mockFetchSuccess(body: string, status = 200) {
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(body, { status, headers: { 'content-type': 'application/json' } })
  );
}

describe('getPins', () => {
  it('parses JSON array response', async () => {
    const pins = mockPinsArray(3);
    mockFetchSuccess(JSON.stringify(pins));
    const result = await getPins();
    expect(result).toHaveLength(3);
    expect(result[0].cid).toBe('QmTest0');
  });

  it('parses NDJSON response', async () => {
    const lines = mockPinsArray(2).map((p) => JSON.stringify(p)).join('\n');
    mockFetchSuccess(lines);
    const result = await getPins();
    expect(result).toHaveLength(2);
  });

  it('parses single object response as array', async () => {
    mockFetchSuccess(singlePinJson);
    const result = await getPins();
    expect(result).toHaveLength(1);
    expect(result[0].cid).toBe('QmTest');
  });

  it('returns empty array for empty response', async () => {
    mockFetchSuccess('');
    const result = await getPins();
    expect(result).toEqual([]);
  });

  it('throws on oversized response by content-length', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('{}', { status: 200, headers: { 'content-length': '6000000' } })
    );
    await expect(getPins()).rejects.toThrow('Response too large');
  });

  it('throws on oversized response body', async () => {
    const big = 'x'.repeat(6 * 1024 * 1024);
    mockFetchSuccess(big);
    await expect(getPins()).rejects.toThrow('Response too large');
  });

  it('throws on HTTP error', async () => {
    mockFetchSuccess('Not Found', 404);
    await expect(getPins()).rejects.toThrow('Cluster request failed');
  });

  it('throws on malformed JSON', async () => {
    mockFetchSuccess('not-json');
    await expect(getPins()).rejects.toThrow('Invalid response format');
  });

  it('throws when pin count exceeds MAX_PINS', async () => {
    const pins = mockPinsArray(10001);
    mockFetchSuccess(JSON.stringify(pins));
    await expect(getPins()).rejects.toThrow('exceeds maximum');
  });

  it('throws when peer allocations exceed MAX_PEER_ALLOCATIONS', async () => {
    vi.stubEnv('MAX_PEER_ALLOCATIONS', '3');
    vi.stubEnv('MAX_RESPONSE_BYTES', '99999999');
    vi.resetModules();
    const { getPins: getPinsDyn } = await import('./cluster');
    const { clearAll: clearCache } = await import('./cache');
    clearCache();

    const peerMap: Record<string, { peername: string; status: string; error: string }> = {};
    for (let i = 0; i < 4; i++) {
      peerMap[`p${i}`] = { peername: `p${i}`, status: 'pinned', error: '' };
    }
    const pin = {
      cid: 'QmTest',
      name: 'test',
      allocations: Object.keys(peerMap),
      peer_map: peerMap,
      replication_factor_min: 1,
      replication_factor_max: 3,
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([pin]), { status: 200 })
    );
    await expect(getPinsDyn()).rejects.toThrow('exceeds maximum');
    vi.unstubAllEnvs();
  });
});

describe('cache behavior', () => {
  it('returns cached pins on second call without fetching', async () => {
    const pins = mockPinsArray(3);
    mockFetchSuccess(JSON.stringify(pins));
    const a = await getPins();
    const b = await getPins();
    expect(a).toHaveLength(3);
    expect(b).toHaveLength(3);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('fetches again after TTL expires', async () => {
    const pins = mockPinsArray(3);
    mockFetchSuccess(JSON.stringify(pins));
    await getPins();
    vi.advanceTimersByTime(15001);
    mockFetchSuccess(JSON.stringify(pins));
    await getPins();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('mutations invalidate cache', () => {
  it('addPin invalidates pins cache', async () => {
    const pins = mockPinsArray(3);
    mockFetchSuccess(JSON.stringify(pins));
    await getPins();

    mockFetchSuccess(JSON.stringify({ cid: 'QmNew' }));
    await addPin('QmNew');

    mockFetchSuccess(JSON.stringify(pins));
    await getPins();
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('removePin invalidates pins cache', async () => {
    const pins = mockPinsArray(3);
    mockFetchSuccess(JSON.stringify(pins));
    await getPins();

    mockFetchSuccess(JSON.stringify({ cid: 'QmTest0' }));
    await removePin('QmTest0');

    mockFetchSuccess(JSON.stringify(pins));
    await getPins();
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('invalidateCache clears all caches', async () => {
    mockFetchSuccess(JSON.stringify({ peername: 'test' }));
    await getId();
    mockFetchSuccess(JSON.stringify(mockPinsArray(2)));
    await getPins();
    invalidateCache();
    mockFetchSuccess(JSON.stringify({ peername: 'test' }));
    mockFetchSuccess(JSON.stringify(mockPinsArray(2)));
    await getId();
    await getPins();
    expect(fetch).toHaveBeenCalledTimes(4);
  });
});

describe('getId and getPeers', () => {
  it('returns peer info from /id', async () => {
    const idData = { peername: 'coordinator', id: 'peerID123', addresses: [], cluster_peers: [], version: '1.0', ipfs: { id: 'ipfsID', addresses: [], error: '' } };
    mockFetchSuccess(JSON.stringify(idData));
    const result = await getId();
    expect(result.peername).toBe('coordinator');
  });

  it('returns peers list from /peers', async () => {
    const peersData = [{ peername: 'peer1', id: 'a', addresses: [], cluster_peers: [], version: '1.0', ipfs: { id: '', addresses: [], error: '' } }];
    mockFetchSuccess(JSON.stringify(peersData));
    const result = await getPeers();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('metrics', () => {
  it('returns activeRequests and totalRejected', () => {
    const m = getMetrics();
    expect(m).toHaveProperty('activeRequests');
    expect(m).toHaveProperty('totalRejected');
  });
});