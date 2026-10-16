import type { Spot } from '@waypoint/contracts/destinations';
import { DAILY_VISIT_MINUTES } from '@waypoint/contracts/destinations';
import type {
  StopKind,
  TripDay,
  TripDetail,
  TripPace,
  TripStop,
} from '@waypoint/contracts/trips';
import { formatDay, formatDuration, formatMoney } from '@/shared/utils/format';
import { capitalised, plural } from '@/shared/utils/text';

export type TimelineItem = {
  readonly key: string;
  /** "09:30". */
  readonly time: string;
  readonly name: string;
  readonly meta: string;
  /** "8 min walk", "Transit · 25 min"; `null` for the first stop and fixed moments. */
  readonly travel: string | null;
  /** A spot (yellow, editable) or a fixed moment around the spots (dashed). */
  readonly isSpot: boolean;
  readonly spotId: string | null;
};

const MOMENT_META: Readonly<Record<Exclude<StopKind, 'spot'>, string>> = {
  arrival: 'Flight',
  'check-in': 'Your stay',
  lunch: 'Eat nearby',
  'to-airport': 'Transfer',
  departure: 'Flight',
};

/** Below this share of the pace a day is easy; above the second, full. */
const EASY_BELOW = 0.6;
const FULL_FROM = 0.9;

const travelText = (stop: TripStop): string | null => {
  if (stop.travelMinutesFromPrevious === null || stop.travelMode === null)
    return null;

  const minutes = formatDuration(stop.travelMinutesFromPrevious);

  return stop.travelMode === 'walk'
    ? `${minutes} walk`
    : `Transit · ${minutes}`;
};

const feeText = (spot: Spot): string | null => {
  switch (spot.fee.kind) {
    case 'free':
      return 'Free';
    case 'paid':
      return spot.fee.price === null ? 'Ticket' : formatMoney(spot.fee.price);
    case 'unknown':
      return null;
  }
};

const spotMeta = (stop: TripStop, spot: Spot | undefined): string =>
  [
    spot === undefined ? null : capitalised(spot.category),
    formatDuration(stop.minutes),
    spot === undefined ? null : feeText(spot),
  ]
    .filter((part) => part !== null)
    .join(' · ');

/** One stop as the timeline shows it. */
export const timelineItem = (
  stop: TripStop,
  spots: ReadonlyMap<string, Spot>,
): TimelineItem => ({
  key: stop.id,
  time: stop.startsAt.slice(0, 5),
  name: stop.name,
  meta:
    stop.kind === 'spot'
      ? spotMeta(
          stop,
          stop.spotId === null ? undefined : spots.get(stop.spotId),
        )
      : `${MOMENT_META[stop.kind]} · ${formatDuration(stop.minutes)}`,
  travel: stop.kind === 'spot' ? travelText(stop) : null,
  isSpot: stop.kind === 'spot',
  spotId: stop.spotId,
});

/** "Day 2" over "Mon 16". */
export const dayTab = (day: TripDay, index: number) => ({
  label: `Day ${String(index + 1)}`,
  date: formatDay(day.date),
});

/** "4 stops · balanced": its spots, and how full it is for the pace. */
export const dayMeta = (day: TripDay, pace: TripPace): string => {
  const spots = day.stops.filter((stop) => stop.kind === 'spot');
  const used = spots.reduce(
    (sum, stop) => sum + stop.minutes + (stop.travelMinutesFromPrevious ?? 0),
    0,
  );
  const share = used / DAILY_VISIT_MINUTES[pace];
  const feel =
    share < EASY_BELOW ? 'easy' : share < FULL_FROM ? 'balanced' : 'full';

  return spots.length === 0
    ? 'Travel day'
    : `${plural(spots.length, 'stop')} · ${feel}`;
};

/** The trip's spots that aren't in the plan — they didn't fit, or were taken out. */
export const notPlanned = (
  trip: Pick<TripDetail, 'spots' | 'days'>,
): TripDetail['spots'] => {
  const planned = new Set(
    trip.days.flatMap((day) => day.stops.map((stop) => stop.spotId)),
  );

  return trip.spots.filter((spot) => !planned.has(spot.spotId));
};
