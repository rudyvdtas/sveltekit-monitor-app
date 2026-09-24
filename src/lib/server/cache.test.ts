import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getOrSet, invalidate, clearAll } from './cache';

beforeEach(() => {
  clearAll();
  vi.useFakeTimers({ toFake: ['Date'] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getOrSet', () => {
  it('returns value from factory on first call', async () => {
    const result = await getOrSet('key1', () => Promise.resolve(42), 1000);
    expect(result).toBe(42);
  });

  it('returns cached value within TTL without calling factory again', async () => {
    const factory = vi.fn().mockResolvedValue(42);
    const a = await getOrSet('key1', factory, 1000);
    const b = await getOrSet('key1', factory, 1000);
    expect(a).toBe(42);
    expect(b).toBe(42);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('calls factory again after TTL expires', async () => {
    const factory = vi.fn().mockResolvedValue(42);
    await getOrSet('key1', factory, 1000);
    vi.advanceTimersByTime(1001);
    await getOrSet('key1', factory, 1000);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent calls (single-flight)', async () => {
    const factory = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(99), 500))
    );
    const [a, b, c] = await Promise.all([
      getOrSet('key1', factory, 1000),
      getOrSet('key1', factory, 1000),
      getOrSet('key1', factory, 1000),
    ]);
    expect(a).toBe(99);
    expect(b).toBe(99);
    expect(c).toBe(99);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('does not cache error responses', async () => {
    const factory = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(42);

    await expect(getOrSet('key1', factory, 1000)).rejects.toThrow('fail');
    const result = await getOrSet('key1', factory, 1000);
    expect(result).toBe(42);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

describe('invalidate', () => {
  it('removes cached entry', async () => {
    const factory = vi.fn().mockResolvedValue(42);
    await getOrSet('key1', factory, 1000);
    invalidate('key1');
    await getOrSet('key1', factory, 1000);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

describe('clearAll', () => {
  it('clears all cached entries', async () => {
    const factory = vi.fn().mockResolvedValue(42);
    await getOrSet('a', factory, 1000);
    await getOrSet('b', factory, 1000);
    clearAll();
    await getOrSet('a', factory, 1000);
    await getOrSet('b', factory, 1000);
    expect(factory).toHaveBeenCalledTimes(4);
  });
});