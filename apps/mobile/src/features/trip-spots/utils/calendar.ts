import type { IsoDate } from '@waypoint/contracts/common';
import { MONTH_NAMES, toIsoDate } from '@/shared/utils/dates';

// The month calendar of the date sheet. Dates are `YYYY-MM-DD` strings in UTC
// (see shared/utils/dates).

export type MonthRef = { readonly year: number; readonly month: number };

export const monthOf = (date: IsoDate): MonthRef => ({
  year: Number(date.slice(0, 4)),
  month: Number(date.slice(5, 7)) - 1,
});

export const shiftMonth = ({ year, month }: MonthRef, by: number): MonthRef => {
  const index = year * 12 + month + by;

  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
};

export const monthTitle = ({ year, month }: MonthRef): string =>
  `${MONTH_NAMES[month] ?? ''} ${String(year)}`;

/** The month as weeks Monday→Sunday; days outside the month are `null`. */
export const monthGrid = ({ year, month }: MonthRef): (IsoDate | null)[][] => {
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7;
  const cells = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      toIsoDate(new Date(Date.UTC(year, month, i + 1))),
    ),
  ];
  const padded = [
    ...cells,
    ...Array.from({ length: (7 - (cells.length % 7)) % 7 }, () => null),
  ];

  return Array.from({ length: padded.length / 7 }, (_, week) =>
    padded.slice(week * 7, week * 7 + 7),
  );
};

/** The days picked so far: the first one, then the whole range. */
export type DateRange =
  | { readonly kind: 'start'; readonly start: IsoDate }
  | { readonly kind: 'range'; readonly start: IsoDate; readonly end: IsoDate };

/**
 * Tapping a day: the first tap sets the start; the next tap on or after it
 * sets the end; tapping before the start, or after a full range, starts over.
 */
export const pickDay = (range: DateRange, day: IsoDate): DateRange =>
  range.kind === 'start' && day >= range.start
    ? { kind: 'range', start: range.start, end: day }
    : { kind: 'start', start: day };

export type DayState = 'edge' | 'inside' | 'none' | 'past';

/** How a day shows: before today, an end of the range, inside it, or neither. */
export const dayState = (
  day: IsoDate,
  range: DateRange,
  today: IsoDate,
): DayState => {
  if (day < today) return 'past';

  if (day === range.start) return 'edge';

  if (range.kind === 'start') return 'none';

  if (day === range.end) return 'edge';

  return day > range.start && day < range.end ? 'inside' : 'none';
};
