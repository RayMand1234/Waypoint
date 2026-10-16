import { isoDateSchema, type IsoDate } from '@waypoint/contracts/common';

// Calendar dates as `YYYY-MM-DD` strings, computed in UTC so no time zone or
// daylight-saving change can shift a day.

export const DAY_MS = 86_400_000;

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const toIsoDate = (date: Date): IsoDate =>
  isoDateSchema.parse(date.toISOString().slice(0, 10));

export const addDays = (date: IsoDate, days: number): IsoDate =>
  toIsoDate(new Date(Date.parse(date) + days * DAY_MS));

/** Today in the traveler's own calendar. */
export const todayOf = (now: Date): IsoDate =>
  toIsoDate(
    new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
  );

/** Days in a trip, counting both ends: 12–16 May is 5. */
export const tripDays = (startDate: IsoDate, endDate: IsoDate): number =>
  Math.round((Date.parse(endDate) - Date.parse(startDate)) / DAY_MS) + 1;
