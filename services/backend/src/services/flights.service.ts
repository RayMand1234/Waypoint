import type { Result } from '@waypoint/contracts/common';
import {
  flightSearchResponseSchema,
  type FlightOffer,
  type FlightSearchRequest,
  type FlightSearchResponse,
} from '@waypoint/contracts/flights';
import { stableKey } from '../lib/stableKey.ts';
import type { Logger } from '../observability/logger.ts';
import type {
  FlightProvider,
  ProviderFlightOffer,
} from '../providers/types.ts';
import type { Cached } from './cache.service.ts';
import type { ServiceError } from './errors.ts';
import { LIVE_RATES_TTL_MS, searchOffers, toOfferSource } from './offers.ts';
import { rankByValue } from './value.ts';

const PROVIDER_TIMEOUT_MS = 20_000;
/** Each stop costs this share of an itinerary's quality. */
const STOP_PENALTY = 0.85;

export type FlightsService = {
  readonly search: (
    request: FlightSearchRequest,
  ) => Promise<Result<FlightSearchResponse, ServiceError>>;
};

const totalMinutes = (offer: ProviderFlightOffer): number =>
  offer.legs.reduce((sum, leg) => sum + leg.durationMinutes, 0);

const totalStops = (offer: ProviderFlightOffer): number =>
  offer.legs.reduce((sum, leg) => sum + leg.stops, 0);

/**
 * Quality relative to the fastest itinerary found: the fastest non-stop is 1;
 * twice as long is 0.5; each stop takes another 15%.
 */
export const flightQuality = (
  offer: ProviderFlightOffer,
  fastestMinutes: number,
): number => {
  const minutes = totalMinutes(offer);
  const speed =
    minutes > 0 && fastestMinutes > 0
      ? Math.min(1, fastestMinutes / minutes)
      : 1;

  return speed * STOP_PENALTY ** totalStops(offer);
};

/** Provider offers → ranked `FlightOffer`s. Pure. */
export const toFlightOffers = (
  offers: readonly ProviderFlightOffer[],
  request: FlightSearchRequest,
): FlightOffer[] => {
  const fastest = Math.min(...offers.map(totalMinutes).filter((m) => m > 0));

  return rankByValue(
    offers,
    (offer) => ({
      priceMinor: offer.price.amountMinor,
      quality: flightQuality(offer, fastest),
    }),
    request.currency,
  )
    .slice(0, request.limit)
    .map(({ item, value }) => ({
      id: item.itineraryId,
      legs: [...item.legs],
      bestPrice: item.price,
      refundable: item.refundable,
      changeable: item.changeable,
      baggage: item.baggage,
      seatsRemaining: item.seatsRemaining,
      expiresAt: item.expiresAt,
      sources: [toOfferSource(item)],
      value,
    }));
};

export const createFlightsService = ({
  providers,
  cached,
  logger,
}: {
  readonly providers: readonly FlightProvider[];
  readonly cached: Cached;
  readonly logger: Logger;
}): FlightsService => ({
  search: (request) =>
    cached({
      key: `flights:search:${stableKey(request)}`,
      ttlMs: LIVE_RATES_TTL_MS,
      schema: flightSearchResponseSchema,
      shouldStore: (response) => response.errors.length === 0,
      load: () =>
        searchOffers({
          label: 'flight',
          providers,
          call: (provider, signal) => provider.searchFlights(request, signal),
          timeoutMs: PROVIDER_TIMEOUT_MS,
          logger,
          toOffers: (offers) => toFlightOffers(offers, request),
        }),
    }),
});
