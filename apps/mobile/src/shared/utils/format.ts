import type { Money } from '@waypoint/contracts/common';
import { MONTH_NAMES } from './dates';
import { plural } from './text';

const THIN_SPACE = ' ';
const EN_DASH = '–';

const SYMBOLS: Readonly<Record<Money['currency'], string>> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  ILS: '₪',
};

const MONTHS_SHORT = MONTH_NAMES.map((name) => name.slice(0, 3));

const wholeUnits = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

/** `€ 1,190` — currency, thin space, whole units (prices are shown rounded). */
export const formatMoney = (money: Money): string =>
  `${SYMBOLS[money.currency]}${THIN_SPACE}${wholeUnits.format(Math.round(money.amountMinor / 100))}`;

type DayMonth = { readonly day: number; readonly month: string };

/** `2026-05-12` → day 12, `May`. Read from the string so no time zone can shift it. */
const dayMonth = (isoDate: string): DayMonth => ({
  day: Number(isoDate.slice(8, 10)),
  month: MONTHS_SHORT[Number(isoDate.slice(5, 7)) - 1] ?? '',
});

/** `12–16 May`, or `28 Apr – 3 May` across months. */
export const formatDateRange = (start: string, end: string): string => {
  const from = dayMonth(start);
  const to = dayMonth(end);

  return from.month === to.month
    ? `${String(from.day)}${EN_DASH}${String(to.day)} ${to.month}`
    : `${String(from.day)} ${from.month} ${EN_DASH} ${String(to.day)} ${to.month}`;
};

/** `1 traveler`, `2 travelers`. */
export const formatTravelers = (count: number): string =>
  plural(count, 'traveler');

/** `2 adults`, `1 adult · 1 child`. */
export const formatParty = (
  adults: number,
  childrenAges: readonly number[],
): string =>
  [
    plural(adults, 'adult'),
    ...(childrenAges.length === 0
      ? []
      : [plural(childrenAges.length, 'child', 'children')]),
  ].join(' · ');

const MINUTES_PER_HOUR = 60;

/** `45m`, `2h`, `1h 30m`. */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  if (hours === 0) return `${String(rest)}m`;

  return rest === 0
    ? `${String(hours)}h`
    : `${String(hours)}h ${String(rest)}m`;
};

const WEEKDAYS_SHORT = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

/** `Sun 15`, or `Sun 15 Nov` with the month — from the date part of a local date-time or date. */
export const formatDay = (
  localDate: string,
  { withMonth = false }: { readonly withMonth?: boolean } = {},
): string => {
  const { day, month } = dayMonth(localDate);
  const weekday =
    WEEKDAYS_SHORT[
      new Date(
        Date.UTC(
          Number(localDate.slice(0, 4)),
          Number(localDate.slice(5, 7)) - 1,
          day,
        ),
      ).getUTCDay()
    ] ?? '';

  return withMonth
    ? `${weekday} ${String(day)} ${month}`
    : `${weekday} ${String(day)}`;
};

/** `08:10` — the time part of a local date-time. */
export const formatClock = (localDateTime: string): string =>
  localDateTime.slice(11, 16);
