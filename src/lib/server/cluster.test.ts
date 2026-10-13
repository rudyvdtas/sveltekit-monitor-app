import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPinStatus } from './cluster';
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

  it('caches results within TTL', async () => {
    mockFetchSuccess(JSON.stringify({
      cid: 'QmCached',
      name: '',
      allocations: [],
      peer_map: {},
      replication_factor_min: 1,
      replication_factor_max: 1,
    }));
    await getPinStatus('QmCached');
    await getPinStatus('QmCached');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
