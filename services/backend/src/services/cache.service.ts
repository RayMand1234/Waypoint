import { ok, type Result } from '@waypoint/contracts/common';
import type { z } from 'zod';
import type { Logger } from '../observability/logger.ts';
import { serializeError } from '../observability/serializeError.ts';
import type { CacheRepository } from '../repositories/cache.repository.ts';

export type CacheRequest<Schema extends z.ZodType, E> = {
  readonly key: string;
  readonly ttlMs: number;
  /** Re-validates what comes back from the cache; a mismatch is a miss. */
  readonly schema: Schema;
  readonly load: () => Promise<Result<z.output<Schema>, E>>;
  /** Whether a loaded value may be stored, e.g. not a partial search. Defaults to yes. */
  readonly shouldStore?: (value: z.output<Schema>) => boolean;
};

export type Cached = <Schema extends z.ZodType, E>(
  request: CacheRequest<Schema, E>,
) => Promise<Result<z.output<Schema>, E>>;

/**
 * Read-through cache in Postgres. A hit skips `load`; a miss calls it and
 * stores a successful value until `now + ttlMs`. Failures are never stored.
 * The cache is an optimisation: if the database misbehaves, it's logged and
 * the request goes to the provider as if nothing were cached.
 */
export const createCached =
  ({
    cache,
    now,
    logger,
  }: {
    readonly cache: CacheRepository;
    readonly now: () => Date;
    readonly logger: Logger;
  }): Cached =>
  async ({ key, ttlMs, schema, load, shouldStore = () => true }) => {
    const hit = await cache.get(key, now()).catch((error: unknown) => {
      logger.warn('cache read failed', { key, error: serializeError(error) });

      return undefined;
    });
    const parsed = hit === undefined ? undefined : schema.safeParse(hit);

    if (parsed?.success === true) {
      logger.debug('cache hit', { key });

      return ok(parsed.data);
    }

    const loaded = await load();

    if (loaded.ok && shouldStore(loaded.value)) {
      const at = now();

      await cache
        .set(key, loaded.value, at, new Date(at.getTime() + ttlMs))
        .catch((error: unknown) => {
          logger.warn('cache write failed', {
            key,
            error: serializeError(error),
          });
        });
    }

    return loaded;
  };
