import { LessThan, MoreThan, type DataSource } from 'typeorm';
import { CacheEntryEntity } from '../entities/index.ts';

export type CacheRepository = {
  /** The stored value if it hasn't expired at `now`, else `undefined`. */
  readonly get: (key: string, now: Date) => Promise<unknown>;
  readonly set: (
    key: string,
    value: unknown,
    now: Date,
    expiresAt: Date,
  ) => Promise<void>;
  /** Removes every entry expired at `now`; returns how many. */
  readonly deleteExpired: (now: Date) => Promise<number>;
};

export const createCacheRepository = (
  dataSource: DataSource,
): CacheRepository => {
  const repo = dataSource.getRepository(CacheEntryEntity);

  return {
    get: async (key, now) => {
      const entry = await repo.findOne({
        where: { key, expiresAt: MoreThan(now) },
      });

      return entry?.value;
    },
    // Raw upsert: one round trip, and safe when two requests fill the same key at once.
    set: async (key, value, now, expiresAt) => {
      await dataSource.query(
        `INSERT INTO ${repo.metadata.tablePath} ("key", "value", "created_at", "expires_at")
         VALUES ($1, $2::jsonb, $3, $4)
         ON CONFLICT ("key") DO UPDATE
           SET "value" = EXCLUDED."value", "created_at" = EXCLUDED."created_at", "expires_at" = EXCLUDED."expires_at"`,
        [key, JSON.stringify(value), now, expiresAt],
      );
    },
    deleteExpired: async (now) => {
      const result = await repo.delete({ expiresAt: LessThan(now) });

      return result.affected ?? 0;
    },
  };
};
