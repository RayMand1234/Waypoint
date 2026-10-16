import {
  isoDateTimeSchema,
  type IsoDateTime,
} from '@waypoint/contracts/common';
import type { z } from 'zod';
import type { Logger } from '../../observability/logger.ts';

export type ParsedItems<T> = {
  readonly items: readonly T[];
  readonly dropped: number;
};

/**
 * Parses each element on its own, so one malformed hotel or flight drops
 * only itself instead of failing the whole response. The adapter logs
 * `dropped` so a provider changing its shape doesn't go unnoticed.
 */
export const parseEach = <Schema extends z.ZodType>(
  schema: Schema,
  items: readonly unknown[],
): ParsedItems<z.output<Schema>> => {
  const valid = items.flatMap((item) => {
    const parsed = schema.safeParse(item);

    return parsed.success ? [parsed.data] : [];
  });

  return { items: valid, dropped: items.length - valid.length };
};

/**
 * Warns when rows were dropped, so a provider changing its response shape
 * shows up in the logs instead of as quietly shorter lists.
 */
export const logDropped = (
  logger: Logger,
  what: string,
  dropped: number,
  kept: number,
): void => {
  if (dropped > 0)
    logger.warn('liteapi rows dropped: unexpected shape', {
      what,
      dropped,
      kept,
    });
};

/** "Checked at" for every offer in one response: the moment it was received. */
export const checkedAtFrom = (now: () => Date): IsoDateTime =>
  isoDateTimeSchema.parse(now().toISOString());
