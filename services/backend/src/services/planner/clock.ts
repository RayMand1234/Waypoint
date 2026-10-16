import {
  isoTimeSchema,
  type IsoDate,
  type IsoTime,
} from '@waypoint/contracts/common';

// Times of day as minutes after midnight, so the planner can add and compare them.

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

export const at = (hours: number, minutes = 0): number =>
  hours * MINUTES_PER_HOUR + minutes;

/** `HH:MM` (or `HH:MM:SS`) → minutes after midnight. */
export const minutesOf = (time: string): number =>
  at(Number(time.slice(0, 2)), Number(time.slice(3, 5)));

/** Minutes after midnight → `HH:MM`, wrapping past midnight. */
export const timeOf = (minutes: number): IsoTime => {
  const wrapped =
    ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) %
    MINUTES_PER_DAY;
  const hours = Math.floor(wrapped / MINUTES_PER_HOUR);
  const rest = wrapped % MINUTES_PER_HOUR;

  return isoTimeSchema.parse(
    `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`,
  );
};

/** ISO weekday of a date: 1 = Monday … 7 = Sunday. */
export const weekdayOf = (date: IsoDate): number => {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();

  return day === 0 ? 7 : day;
};
