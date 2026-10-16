import { err, ok } from '@waypoint/contracts/common';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { CacheRepository } from '../repositories/cache.repository.ts';
import { silentLogger } from '../testing/index.ts';
import { createCached } from './cache.service.ts';

const memoryCache = (): CacheRepository & {
  readonly store: Map<string, { value: unknown; expiresAt: Date }>;
} => {
  const store = new Map<string, { value: unknown; expiresAt: Date }>();

  return {
    store,
    get: (key, now) => {
      const entry = store.get(key);

      return Promise.resolve(
        entry !== undefined && entry.expiresAt > now ? entry.value : undefined,
      );
    },
    set: (key, value, _now, expiresAt) => {
      store.set(key, {
        value: JSON.parse(JSON.stringify(value)) as unknown,
        expiresAt,
      });

      return Promise.resolve();
    },
    deleteExpired: () => Promise.resolve(0),
  };
};

const schema = z.object({ n: z.number() });

describe('cached', () => {
  it('loads on a miss, then answers from the cache until it expires', async () => {
    let clock = new Date('2027-01-01T00:00:00Z');
    const cached = createCached({
      cache: memoryCache(),
      now: () => clock,
      logger: silentLogger(),
    });
    const load = vi.fn(() => Promise.resolve(ok({ n: 1 })));
    const ask = () => cached({ key: 'k', ttlMs: 60_000, schema, load });

    expect(await ask()).toEqual({ ok: true, value: { n: 1 } });
    expect(await ask()).toEqual({ ok: true, value: { n: 1 } });
    expect(load).toHaveBeenCalledTimes(1);

    clock = new Date('2027-01-01T00:02:00Z');
    await ask();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('never stores a failure, or a value shouldStore refuses', async () => {
    const cache = memoryCache();
    const cached = createCached({
      cache,
      now: () => new Date(),
      logger: silentLogger(),
    });

    await cached({
      key: 'a',
      ttlMs: 60_000,
      schema,
      load: () => Promise.resolve(err('down')),
    });
    await cached({
      key: 'b',
      ttlMs: 60_000,
      schema,
      load: () => Promise.resolve(ok({ n: 2 })),
      shouldStore: () => false,
    });

    expect(cache.store.size).toBe(0);
  });

  it('treats a stored value that no longer matches the schema as a miss', async () => {
    const cache = memoryCache();

    cache.store.set('k', {
      value: { n: 'old shape' },
      expiresAt: new Date('2100-01-01'),
    });

    const cached = createCached({
      cache,
      now: () => new Date(),
      logger: silentLogger(),
    });
    const result = await cached({
      key: 'k',
      ttlMs: 60_000,
      schema,
      load: () => Promise.resolve(ok({ n: 3 })),
    });

    expect(result).toEqual({ ok: true, value: { n: 3 } });
  });

  it('still answers when the cache itself is broken', async () => {
    const broken: CacheRepository = {
      get: () => Promise.reject(new Error('db down')),
      set: () => Promise.reject(new Error('db down')),
      deleteExpired: () => Promise.resolve(0),
    };
    const cached = createCached({
      cache: broken,
      now: () => new Date(),
      logger: silentLogger(),
    });

    expect(
      await cached({
        key: 'k',
        ttlMs: 1,
        schema,
        load: () => Promise.resolve(ok({ n: 4 })),
      }),
    ).toEqual({
      ok: true,
      value: { n: 4 },
    });
  });
});
