import type { FlightLeg, FlightOffer } from '@waypoint/contracts/flights';
import type { BadgeProps, OfferDelta } from '@/shared/components';
import { DAY_MS } from '@/shared/utils/dates';
import {
  formatClock,
  formatDay,
  formatDuration,
  formatMoney,
} from '@/shared/utils/format';
import { offerDelta } from '@/shared/utils/offerDelta';
import { plural } from '@/shared/utils/text';

/** Few enough seats left to say so. */
const SEATS_WARNING_AT = 5;
/** Airlines named on a card before the rest are counted. */
const AIRLINES_SHOWN = 2;

export type FlightLegLine = {
  /** "Out", "Back". */
  readonly label: string;
  /** "Sun 15 · 08:10 → 11:25 +1 · 11h 30m". */
  readonly text: string;
};

export type FlightCardModel = {
  readonly title: string;
  readonly meta: string;
  readonly legs: readonly FlightLegLine[];
  readonly price: string;
  readonly unit: string;
  readonly delta: OfferDelta | undefined;
  readonly badges: readonly BadgeProps[];
  readonly isBestValue: boolean;
};

export const LEG_LABEL: Readonly<Record<FlightLeg['direction'], string>> = {
  outbound: 'Out',
  inbound: 'Back',
};

/** The airlines flown, in order: "TAP Air Portugal", "Lufthansa + United", "Delta + United +1". */
export const airlinesOf = (offer: FlightOffer): string => {
  const names = [
    ...new Set(
      offer.legs.flatMap((leg) =>
        leg.segments.map((s) => s.carrier.name ?? s.carrier.code),
      ),
    ),
  ];
  const shown = names.slice(0, AIRLINES_SHOWN).join(' + ');
  const more = names.length - AIRLINES_SHOWN;

  return more > 0 ? `${shown} +${String(more)}` : shown;
};

/** "Direct", or the most stops of either way and where: "1 stop · MUC". */
export const stopsOf = (offer: FlightOffer): string => {
  const most = Math.max(...offer.legs.map((leg) => leg.stops));

  if (most === 0) return 'Direct';

  const via = [
    ...new Set(
      offer.legs.flatMap((leg) => leg.segments.slice(0, -1).map((s) => s.to)),
    ),
  ];

  return `${plural(most, 'stop')} · ${via.join(', ')}`;
};

/** Days between two local date-times' dates: an overnight arrival is `1`. */
const daysLater = (from: string, to: string): number =>
  Math.round(
    (Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10))) / DAY_MS,
  );

/** "08:10 → 11:25", with "+1" when it lands a day later. */
export const legTimes = (leg: FlightLeg): string => {
  const later = daysLater(leg.departAt, leg.arriveAt);

  return `${formatClock(leg.departAt)} → ${formatClock(leg.arriveAt)}${later > 0 ? ` +${String(later)}` : ''}`;
};

export const legLine = (leg: FlightLeg): FlightLegLine => ({
  label: LEG_LABEL[leg.direction],
  text: `${formatDay(leg.departAt)} · ${legTimes(leg)} · ${formatDuration(leg.durationMinutes)}`,
});

/** What the fare includes for bags, or that its terms say. */
export const bagsOf = ({ baggage }: FlightOffer): string => {
  if (baggage.checked === true) return 'Checked bag included';

  if (baggage.carryOn === true) return 'Cabin bag only';

  return 'Bags: check the fare terms';
};

const badgesOf = (offer: FlightOffer): BadgeProps[] => [
  ...(offer.value.isBestValue
    ? [{ kind: 'value' as const, label: 'Best value' }]
    : []),
  { kind: 'neutral', label: stopsOf(offer) },
  ...(offer.seatsRemaining !== null && offer.seatsRemaining <= SEATS_WARNING_AT
    ? [
        {
          kind: 'warning' as const,
          label: `${plural(offer.seatsRemaining, 'seat')} left`,
        },
      ]
    : []),
];

/** What one fare's card says, against the best-value fare. */
export const flightCard = (
  offer: FlightOffer,
  bestValue: FlightOffer | undefined,
  travelers: number,
): FlightCardModel => ({
  title: airlinesOf(offer),
  meta: bagsOf(offer),
  legs: offer.legs.map(legLine),
  price: formatMoney(offer.bestPrice),
  unit: `${plural(travelers, 'traveler')} · ${offer.legs.length > 1 ? 'round trip' : 'one way'}`,
  delta: offerDelta(offer, bestValue),
  badges: badgesOf(offer),
  isBestValue: offer.value.isBestValue,
});
