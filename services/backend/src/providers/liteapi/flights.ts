import {
  isoDateTimeSchema,
  isoLocalDateTimeSchema,
  ok,
  type IsoDateTime,
} from '@waypoint/contracts/common';
import type {
  CabinClass,
  FlightLeg,
  FlightSearchRequest,
  FlightSegment,
} from '@waypoint/contracts/flights';
import type { z } from 'zod';
import { toMoney } from '../../lib/money.ts';
import type { Logger } from '../../observability/logger.ts';
import type { FlightProvider, ProviderFlightOffer } from '../types.ts';
import type { LiteApiClient } from './client.ts';
import { offerCheckoutLink } from './deepLinks.ts';
import { checkedAtFrom, logDropped, parseEach } from './parse.ts';
import { rawFlightRatesEnvelope, rawJourney } from './schemas.ts';

type RawJourney = z.output<typeof rawJourney>;
type RawSegment = RawJourney['segments'][number];
type Direction = FlightLeg['direction'];

const CABIN: Readonly<Record<CabinClass, string>> = {
  economy: 'ECONOMY',
  'premium-economy': 'PREMIUM_ECONOMY',
  business: 'BUSINESS',
  first: 'FIRST',
};

const toRequest = (query: FlightSearchRequest): Record<string, unknown> => ({
  legs: [
    {
      origin: query.origin,
      destination: query.destination,
      date: query.departDate,
      direction: 'OUTBOUND',
    },
    ...(query.returnDate === null
      ? []
      : [
          {
            origin: query.destination,
            destination: query.origin,
            date: query.returnDate,
            direction: 'INBOUND',
          },
        ]),
  ],
  adults: query.adults,
  children: query.children,
  infants: query.infants,
  cabinClass: CABIN[query.cabinClass],
  currency: query.currency,
  sort: { sortBy: 'price', sortOrder: 'asc' },
  ...(query.maxStops === null ? {} : { filters: { maxStops: query.maxStops } }),
});

const directionOf = (raw: string | null | undefined): Direction =>
  raw?.toUpperCase() === 'INBOUND' ? 'inbound' : 'outbound';

/** Airport-local wall time: drop any offset or fraction liteAPI adds. */
const localTime = (raw: string) =>
  isoLocalDateTimeSchema.safeParse(raw.slice(0, 19));

const toSegment = (raw: RawSegment): FlightSegment | undefined => {
  const departAt = localTime(raw.departureTime);
  const arriveAt = localTime(raw.arrivalTime);

  if (!departAt.success || !arriveAt.success) return undefined;

  return {
    from: raw.originCode,
    fromName: raw.originName ?? null,
    to: raw.destinationCode,
    toName: raw.destinationName ?? null,
    departAt: departAt.data,
    arriveAt: arriveAt.data,
    carrier: {
      code: raw.carrier.marketingCode,
      name: raw.carrier.marketingName ?? null,
      logoUrl: raw.carrier.marketingLogo ?? null,
    },
    flightNumber: raw.flight.marketingNumber,
    durationMinutes: raw.duration.minutes,
  };
};

/** Groups a journey's segments into outbound / inbound legs. */
const toLegs = (journey: RawJourney): FlightLeg[] | undefined => {
  const segments = journey.segments.map((raw) => ({
    direction: directionOf(raw.direction),
    segment: toSegment(raw),
  }));

  if (segments.some(({ segment }) => segment === undefined)) return undefined;

  return (['outbound', 'inbound'] as const).flatMap(
    (direction): FlightLeg[] => {
      const legSegments = segments.flatMap((s) =>
        s.direction === direction && s.segment !== undefined ? [s.segment] : [],
      );
      const first = legSegments[0];
      const last = legSegments.at(-1);

      if (first === undefined || last === undefined) return [];

      const reported = journey.legDurations?.find(
        (leg) => directionOf(leg.direction) === direction,
      );

      return [
        {
          direction,
          departAt: first.departAt,
          arriveAt: last.arriveAt,
          // The provider's leg duration includes layovers; the segment sum is a floor.
          durationMinutes:
            reported?.duration.minutes ??
            legSegments.reduce((sum, s) => sum + s.durationMinutes, 0),
          stops: legSegments.length - 1,
          segments: legSegments,
        },
      ];
    },
  );
};

const toExpiry = (raw: string | null | undefined): IsoDateTime | null => {
  const parsed = isoDateTimeSchema.safeParse(raw);

  return parsed.success ? parsed.data : null;
};

/** Live flight fares from liteAPI (Nuitée Connect), cheapest fare per itinerary. */
export const createLiteApiFlightProvider = ({
  client,
  logger,
  whitelabelUrl,
  now,
}: {
  readonly client: LiteApiClient;
  readonly logger: Logger;
  readonly whitelabelUrl: string;
  readonly now: () => Date;
}): FlightProvider => ({
  id: 'liteapi',

  searchFlights: async (query, signal) => {
    const response = await client.post(
      '/flights/rates',
      toRequest(query),
      rawFlightRatesEnvelope,
      signal,
    );

    if (!response.ok) return response;

    const checkedAt = checkedAtFrom(now);
    const journeys = parseEach(
      rawJourney,
      (response.value.data ?? []).flatMap((group) => group.journeys ?? []),
    );

    const offers = journeys.items.flatMap((journey): ProviderFlightOffer[] => {
      const offer = journey.cheapestOffer;
      const legs = toLegs(journey);
      const price = toMoney(
        offer.pricing.display.total,
        offer.pricing.display.currency,
      );

      if (legs === undefined || price?.currency !== query.currency) return [];

      return [
        {
          provider: 'liteapi',
          providerOfferId: offer.offerId,
          itineraryId: journey.journeyKey,
          legs,
          price,
          refundable: offer.terms?.refundable ?? null,
          changeable: offer.terms?.changeable ?? null,
          baggage: {
            carryOn: offer.baggage?.hasCarryOnBag ?? null,
            checked: offer.baggage?.hasCheckedBag ?? null,
          },
          seatsRemaining: offer.fare?.seatsRemaining ?? null,
          expiresAt: toExpiry(offer.expiration),
          deepLink: offerCheckoutLink(whitelabelUrl, offer.offerId),
          checkedAt,
        },
      ];
    });
    const dropped = journeys.dropped + journeys.items.length - offers.length;

    logDropped(logger, 'flight journeys', dropped, offers.length);

    return ok(offers);
  },
});
