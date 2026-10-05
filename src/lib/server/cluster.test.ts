import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPinStatus, getAllocations, getId, getPeers, addPin, removePin, invalidateCache, ClusterError, getMetrics } from './cluster';
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

function mockFetchSuccess(body: string, status = 200) {
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response(body, { status, headers: { 'content-type': 'application/json' } })
  );
}

describe('getPinStatus', () => {
  it('returns PinInfo for a known CID', async () => {
    mockFetchSuccess(JSON.stringify({
      cid: 'QmKnown',
      name: 'known',
      allocations: ['peer1'],
      peer_map: { peer1: { peername: 'peer1', status: 'pinned', error: '' } },
      replication_factor_min: 1,
      replication_factor_max: 3,
    }));
    const result = await getPinStatus('QmKnown');
    expect(result.cid).toBe('QmKnown');
    expect(result.peer_map.peer1.status).toBe('pinned');
  });

  it('returns full peer_map for a CID with multiple peers', async () => {
    const peerMap = {
      peer1: { peername: 'peer1', status: 'pinned', error: '' },
      peer2: { peername: 'peer2', status: 'pinning', error: '' },
      peer3: { peername: 'peer3', status: 'queued', error: '' },
    };
    mockFetchSuccess(JSON.stringify({
      cid: 'QmMulti',
      name: 'multi',
      allocations: ['peer1', 'peer2', 'peer3'],
      peer_map: peerMap,
      replication_factor_min: 1,
      replication_factor_max: 3,
    }));
    const result = await getPinStatus('QmMulti');
    expect(Object.keys(result.peer_map)).toHaveLength(3);
  });

  it('handles unknown CID (cluster returns HTTP 200 with empty allocations)', async () => {
    mockFetchSuccess(JSON.stringify({
      cid: 'QmUnknown',
      name: '',
      allocations: [],
      peer_map: {
        peer1: { peername: 'peer1', status: 'unpinned', error: '' },
        peer2: { peername: 'peer2', status: 'unpinned', error: '' },
      },
      replication_factor_min: 0,
      replication_factor_max: 0,
    }));
    const result = await getPinStatus('QmUnknown');
    expect(result.allocations).toEqual([]);
    expect(Object.values(result.peer_map).every((p: any) => p.status === 'unpinned')).toBe(true);
  });

  it('throws ClusterError on timeout', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network error'));
    await expect(getPinStatus('QmFail')).rejects.toThrow('Cluster unavailable');
  });
});

describe('getAllocations', () => {
  it('returns allocation list', async () => {
    mockFetchSuccess(JSON.stringify([
      { cid: 'QmA', name: 'a', allocations: ['p1'], replication_factor_min: 1, replication_factor_max: 3 },
      { cid: 'QmB', name: 'b', allocations: ['p1', 'p2'], replication_factor_min: 2, replication_factor_max: 3 },
    ]));
    const result = await getAllocations();
    expect(result).toHaveLength(2);
    expect(result[0].cid).toBe('QmA');
    expect(result[1].replication_factor_min).toBe(2);
  });

  it('returns empty array on empty response', async () => {
    mockFetchSuccess('[]');
    const result = await getAllocations();
    expect(result).toEqual([]);
  });

  it('caches results within TTL', async () => {
    mockFetchSuccess(JSON.stringify([{ cid: 'QmC', name: 'c', allocations: [], replication_factor_min: 1, replication_factor_max: 1 }]));
    const a = await getAllocations();
    const b = await getAllocations();
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('cache behavior', () => {
  it('fetches again after TTL expires', async () => {
    mockFetchSuccess(JSON.stringify({ peername: 'coordinator', id: 'p1', addresses: [], cluster_peers: [], version: '1.0', ipfs: { id: '', addresses: [], error: '' } }));
    await getId();
    vi.advanceTimersByTime(15001);
    mockFetchSuccess(JSON.stringify({ peername: 'coordinator', id: 'p1', addresses: [], cluster_peers: [], version: '1.0', ipfs: { id: '', addresses: [], error: '' } }));
    await getId();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('mutations invalidate cache', () => {
  it('addPin invalidates allocations cache', async () => {
    mockFetchSuccess(JSON.stringify([]));
    await getAllocations();

    mockFetchSuccess(JSON.stringify({ cid: 'QmNew' }));
    await addPin('QmNew');

    mockFetchSuccess(JSON.stringify([{ cid: 'QmNew' }]));
    await getAllocations();
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('removePin invalidates allocations cache', async () => {
    mockFetchSuccess(JSON.stringify([{ cid: 'QmTest', name: '', allocations: [], replication_factor_min: 1, replication_factor_max: 1 }]));
    await getAllocations();

    mockFetchSuccess(JSON.stringify({ cid: 'QmTest' }));
    await removePin('QmTest');

    mockFetchSuccess(JSON.stringify([]));
    await getAllocations();
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('invalidateCache clears all caches', async () => {
    mockFetchSuccess(JSON.stringify({ peername: 'test' }));
    await getId();
    mockFetchSuccess(JSON.stringify([]));
    await getAllocations();
    invalidateCache();
    mockFetchSuccess(JSON.stringify({ peername: 'test' }));
    mockFetchSuccess(JSON.stringify([]));
    await getId();
    await getAllocations();
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