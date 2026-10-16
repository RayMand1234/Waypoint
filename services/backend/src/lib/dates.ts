import { isoDateSchema, type IsoDate } from '@waypoint/contracts/common';
import { DAY_MS } from './time.ts';

/** Whole nights between two calendar dates (`2026-05-12` → `2026-05-16` is 4). */
export const nightsBetween = (checkin: IsoDate, checkout: IsoDate): number =>
  Math.round((Date.parse(checkout) - Date.parse(checkin)) / DAY_MS);

/** Today's calendar date in UTC, as `YYYY-MM-DD`. */
export const utcDate = (now: Date): string => now.toISOString().slice(0, 10);

/** Every date from `first` to `last`, both included. */
export const datesBetween = (first: IsoDate, last: IsoDate): IsoDate[] =>
  Array.from({ length: Math.max(0, nightsBetween(first, last) + 1) }, (_, i) =>
    isoDateSchema.parse(
      new Date(Date.parse(first) + i * DAY_MS).toISOString().slice(0, 10),
    ),
  );
