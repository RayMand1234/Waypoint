import type { FlightLeg, FlightOffer } from '@waypoint/contracts/flights';
import { formatDay, formatDuration } from '@/shared/utils/format';
import { plural } from '@/shared/utils/text';
import { bagsOf, LEG_LABEL, legTimes } from './flightCardModel';

export type FlightLegDetail = {
  /** "Out · Sun 15 Nov". */
  readonly label: string;
  /** "08:10 → 11:25 +1". */
  readonly times: string;
  /** "Ben Gurion (TLV) → John F. Kennedy (JFK) · 11h 30m · Change in Munich (1h 10m)". */
  readonly meta: string;
};

const MS_PER_MINUTE = 60_000;

/** "Ben Gurion International Airport" → "Ben Gurion": the name people say. */
const shortAirport = (name: string): string =>
  name.replace(/\s+(International\s+)?Airport$/i, '');

const airport = (name: string | null, code: string): string =>
  name === null ? code : `${shortAirport(name)} (${code})`;

/** Wait at each change of plane: "Change in Munich (1h 10m)". Both times are the same airport's, so they compare. */
const changesOf = (leg: FlightLeg): string[] =>
  leg.segments.slice(1).flatMap((next, index) => {
    const before = leg.segments[index];

    if (before === undefined) return [];

    const wait = Math.round(
      (Date.parse(next.departAt) - Date.parse(before.arriveAt)) / MS_PER_MINUTE,
    );

    return [
      `Change in ${before.toName === null ? before.to : shortAirport(before.toName)} (${formatDuration(Math.max(0, wait))})`,
    ];
  });

export const legDetail = (leg: FlightLeg): FlightLegDetail => {
  const first = leg.segments[0];
  const last = leg.segments.at(-1);
  const route =
    first === undefined || last === undefined
      ? ''
      : `${airport(first.fromName, first.from)} → ${airport(last.toName, last.to)}`;
  const changes = changesOf(leg);

  return {
    label: `${LEG_LABEL[leg.direction]} · ${formatDay(leg.departAt, { withMonth: true })}`,
    times: legTimes(leg),
    meta: [
      route,
      formatDuration(leg.durationMinutes),
      ...(changes.length === 0 ? ['Direct'] : changes),
    ]
      .filter((part) => part !== '')
      .join(' · '),
  };
};

/** `true` yes, `false` no, `null` the provider didn't say. */
const termText = (value: boolean | null, yes: string, no: string): string => {
  if (value === null) return 'Check the fare terms';

  return value ? yes : no;
};

/** The fare's terms, for the details sheet. */
export const fareRows = (
  offer: FlightOffer,
): readonly (readonly [string, string])[] => [
  ['Bags', bagsOf(offer)],
  ['Changes', termText(offer.changeable, 'Changes allowed', 'No changes')],
  ['Refunds', termText(offer.refundable, 'Refundable', 'Non-refundable')],
  [
    'Seats',
    offer.seatsRemaining === null
      ? 'Check on the site'
      : `${plural(offer.seatsRemaining, 'seat')} left`,
  ],
];
