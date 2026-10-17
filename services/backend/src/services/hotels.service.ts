import { assertNever, type Result } from '@waypoint/contracts/common';
import {
  getHotelResponseSchema,
  getHotelReviewsResponseSchema,
  hotelSearchResponseSchema,
  listHotelsResponseSchema,
  type GetHotelResponse,
  type GetHotelReviewsResponse,
  type HotelOffer,
  type HotelSearchRequest,
  type HotelSearchResponse,
  type ListHotelsQuery,
  type ListHotelsResponse,
} from '@waypoint/contracts/hotels';
import { nightsBetween } from '../lib/dates.ts';
import { distanceMeters, type LatLng } from '../lib/distance.ts';
import { stableKey } from '../lib/stableKey.ts';
import type { Logger } from '../observability/logger.ts';
import type {
  HotelCatalog,
  HotelProvider,
  HotelSearchQuery,
  ProviderHotelOffer,
} from '../providers/types.ts';
import { DAY_MS } from '../lib/time.ts';
import type { Cached } from './cache.service.ts';
import { loadFromProvider, type ServiceError } from './errors.ts';
import { toHotelReviews } from './hotelReviews.logic.ts';
import {
  locationFactor,
  searchArea,
  type Points,
  type SearchArea,
  stopsMinutes,
  typicalMinutes,
} from './hotelLocation.logic.ts';
import { LIVE_RATES_TTL_MS, searchOffers, toOfferSource } from './offers.ts';
import { rankByValue } from './value.ts';

const CATALOG_TTL_MS = 7 * DAY_MS;
/** New reviews come in daily. */
const REVIEWS_TTL_MS = DAY_MS;
const PROVIDER_TIMEOUT_MS = 12_000;
/** Used when a hotel has neither a guest rating nor stars. */
const UNKNOWN_QUALITY = 0.6;
/** Guest ratings are out of 10, stars out of 5. */
const RATING_SCALE = 10;
const STAR_SCALE = 5;
const REFUNDABLE_BONUS = 1.05;

export type HotelsService = {
  readonly list: (
    query: ListHotelsQuery,
  ) => Promise<Result<ListHotelsResponse, ServiceError>>;
  readonly detail: (
    hotelId: string,
  ) => Promise<Result<GetHotelResponse, ServiceError>>;
  /** What guests say: the total, the summary, and the best few reviews. */
  readonly reviews: (
    hotelId: string,
  ) => Promise<Result<GetHotelReviewsResponse, ServiceError>>;
  readonly search: (
    request: HotelSearchRequest,
  ) => Promise<Result<HotelSearchResponse, ServiceError>>;
};

/** Guest rating first (out of 10), stars as a fallback; free cancellation counts a little. */
const baseQuality = ({
  rating,
  stars,
}: ProviderHotelOffer['hotel']): number => {
  if (rating !== null && rating > 0) return rating / RATING_SCALE;

  if (stars !== null && stars > 0) return stars / STAR_SCALE;

  return UNKNOWN_QUALITY;
};

export const hotelQuality = (offer: ProviderHotelOffer): number =>
  baseQuality(offer.hotel) *
  (offer.cancellation === 'refundable' ? REFUNDABLE_BONUS : 1);

/**
 * A search as providers take it, and what each hotel is measured against:
 * the trip's stops (and their middle), the searched point, or nothing.
 */
export type ResolvedSearch =
  | {
      readonly kind: 'stops';
      readonly query: HotelSearchQuery;
      readonly area: SearchArea;
      readonly stops: Points;
    }
  | {
      readonly kind: 'point';
      readonly query: HotelSearchQuery;
      readonly origin: LatLng;
    }
  | { readonly kind: 'place'; readonly query: HotelSearchQuery };

/** A search by stops becomes a radius search around their middle. Pure. */
export const resolveSearch = (request: HotelSearchRequest): ResolvedSearch => {
  const { location } = request;

  switch (location.type) {
    case 'stops': {
      const area = searchArea(location.stops);

      return {
        kind: 'stops',
        query: { ...request, location: { type: 'coordinates', ...area } },
        area,
        stops: location.stops,
      };
    }
    case 'coordinates':
      return {
        kind: 'point',
        query: { ...request, location },
        origin: location,
      };
    case 'place':
    case 'city':
      return { kind: 'place', query: { ...request, location } };
    default:
      return assertNever(location);
  }
};

const originOf = (search: ResolvedSearch): LatLng | undefined => {
  switch (search.kind) {
    case 'stops':
      return search.area;
    case 'point':
      return search.origin;
    case 'place':
      return undefined;
    default:
      return assertNever(search);
  }
};

/** The offer nearest the stops (first on ties); `undefined` when none was measured. */
const nearestIndex = (
  minutes: readonly (number | null)[],
): number | undefined => {
  const measured = minutes.flatMap((m, index) =>
    m === null ? [] : [{ m, index }],
  );
  const fewest = Math.min(...measured.map(({ m }) => m));

  return measured.find(({ m }) => m === fewest)?.index;
};

/**
 * Provider offers → ranked `HotelOffer`s. Pure. Searched by stops, a hotel's
 * quality is scaled by how near it is to them, against the other hotels
 * (`locationFactor`). One source per hotel for now; when a second provider
 * arrives, merging the same hotel across sources (`sources` with several
 * rows, lowest as `bestPrice`) goes here.
 */
export const toHotelOffers = (
  offers: readonly ProviderHotelOffer[],
  request: HotelSearchRequest,
  search: ResolvedSearch,
): HotelOffer[] => {
  const nights = Math.max(1, nightsBetween(request.checkin, request.checkout));
  const origin = originOf(search);
  const measured = offers.map((offer) => ({
    offer,
    minutes:
      search.kind === 'stops' ? stopsMinutes(offer.hotel, search.stops) : null,
  }));
  const typical = typicalMinutes(
    measured.flatMap(({ minutes }) => (minutes === null ? [] : [minutes])),
  );
  const ranked = rankByValue(
    measured,
    ({ offer, minutes }) => ({
      priceMinor: offer.price.amountMinor,
      quality:
        hotelQuality(offer) *
        (minutes === null ? 1 : locationFactor(minutes, typical)),
    }),
    request.currency,
  ).slice(0, request.limit);
  const nearest = nearestIndex(ranked.map(({ item }) => item.minutes));

  return ranked.map(({ item: { offer, minutes }, value }, index) => ({
    hotel: offer.hotel,
    roomName: offer.roomName,
    boardName: offer.boardName,
    cancellation: offer.cancellation,
    nights,
    bestPrice: offer.price,
    pricePerNight: {
      amountMinor: Math.round(offer.price.amountMinor / nights),
      currency: offer.price.currency,
    },
    distanceMeters:
      origin === undefined ? null : distanceMeters(origin, offer.hotel),
    stopsMinutes: minutes,
    isBestLocation: index === nearest,
    sources: [toOfferSource(offer)],
    value,
  }));
};

export const createHotelsService = ({
  catalog,
  providers,
  cached,
  logger,
}: {
  readonly catalog: HotelCatalog;
  readonly providers: readonly HotelProvider[];
  readonly cached: Cached;
  readonly logger: Logger;
}): HotelsService => ({
  list: (query) =>
    cached({
      key: `hotels:list:${stableKey(query)}`,
      ttlMs: CATALOG_TTL_MS,
      schema: listHotelsResponseSchema,
      load: loadFromProvider(
        catalog.id,
        () => {
          const { limit, offset, ...location } = query;

          return catalog.listHotels({ location, limit, offset });
        },
        (hotels) => ({ hotels: [...hotels] }),
        'No hotels found there.',
      ),
    }),

  detail: (hotelId) =>
    cached({
      key: `hotels:detail:${hotelId}`,
      ttlMs: CATALOG_TTL_MS,
      schema: getHotelResponseSchema,
      load: loadFromProvider(
        catalog.id,
        () => catalog.hotel(hotelId),
        (hotel) => ({ hotel }),
        'We have no hotel with that id.',
      ),
    }),

  reviews: (hotelId) =>
    cached({
      key: `hotels:reviews:${hotelId}`,
      ttlMs: REVIEWS_TTL_MS,
      schema: getHotelReviewsResponseSchema,
      load: loadFromProvider(
        catalog.id,
        () => catalog.reviews(hotelId),
        (source) => ({ reviews: toHotelReviews(source) }),
        'We have no hotel with that id.',
      ),
    }),

  search: (request) =>
    cached({
      key: `hotels:search:${stableKey(request)}`,
      ttlMs: LIVE_RATES_TTL_MS,
      schema: hotelSearchResponseSchema,
      // A partial answer (a source failed) is shown, but not kept.
      shouldStore: (response) => response.errors.length === 0,
      load: () => {
        const search = resolveSearch(request);

        return searchOffers({
          label: 'hotel',
          providers,
          call: (provider, signal) =>
            provider.searchHotels(search.query, signal),
          timeoutMs: PROVIDER_TIMEOUT_MS,
          logger,
          toOffers: (offers) => toHotelOffers(offers, request, search),
        });
      },
    }),
});
