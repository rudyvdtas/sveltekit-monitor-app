type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const stores = new Map<string, { entry: CacheEntry<unknown> | null; inflight: Promise<unknown> | null }>();

export function getOrSet<T>(key: string, factory: () => Promise<T>, ttlMs: number): Promise<T> {
  const now = Date.now();
  let slot = stores.get(key);

  if (slot?.entry && now < slot.entry.expiresAt) {
    return Promise.resolve(slot.entry.value as T);
  }

  if (slot?.inflight) {
    return slot.inflight as Promise<T>;
  }

  const promise = factory()
    .then((value) => {
      stores.set(key, { entry: { value, expiresAt: now + ttlMs }, inflight: null });
      return value;
    })
    .catch((err) => {
      stores.set(key, { entry: null, inflight: null });
      throw err;
    });

  stores.set(key, { entry: null, inflight: promise });
  return promise;
}

export function invalidate(key: string): void {
  stores.delete(key);
}

export function clearAll(): void {
  stores.clear();
}