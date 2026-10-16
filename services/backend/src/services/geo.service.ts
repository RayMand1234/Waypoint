import type { Result } from '@waypoint/contracts/common';
import {
  cityPricesResponseSchema,
  getPlaceResponseSchema,
  listCitiesResponseSchema,
  listCountriesResponseSchema,
  searchAirportsResponseSchema,
  searchPlacesResponseSchema,
  type CityParams,
  type CityPricesQuery,
  type CityPricesResponse,
  type CountryParams,
  type GetPlaceResponse,
  type ListCitiesResponse,
  type ListCountriesResponse,
  type SearchAirportsQuery,
  type SearchAirportsResponse,
  type SearchPlacesQuery,
  type SearchPlacesResponse,
} from '@waypoint/contracts/geo';
import type { GeoSource, ProviderResult } from '../providers/types.ts';
import { stableKey } from '../lib/stableKey.ts';
import { DAY_MS } from '../lib/time.ts';
import type { Cached } from './cache.service.ts';
import { loadFromProvider, type ServiceError } from './errors.ts';
import { rankAirports } from './geo.logic.ts';

// Reference data changes rarely and some of it costs money per call (Google
// Places through liteAPI), so it is cached for a long time.
const REFERENCE_TTL_MS = 30 * DAY_MS;
const PRICE_INDEX_TTL_MS = DAY_MS;

export type GeoService = {
  readonly countries: () => Promise<
    Result<ListCountriesResponse, ServiceError>
  >;
  readonly cities: (
    params: CountryParams,
  ) => Promise<Result<ListCitiesResponse, ServiceError>>;
  readonly cityPrices: (
    params: CityParams,
    query: CityPricesQuery,
  ) => Promise<Result<CityPricesResponse, ServiceError>>;
  readonly searchPlaces: (
    query: SearchPlacesQuery,
  ) => Promise<Result<SearchPlacesResponse, ServiceError>>;
  readonly place: (
    placeId: string,
  ) => Promise<Result<GetPlaceResponse, ServiceError>>;
  readonly airports: (
    query: SearchAirportsQuery,
  ) => Promise<Result<SearchAirportsResponse, ServiceError>>;
};

export const createGeoService = ({
  source,
  cached,
}: {
  readonly source: GeoSource;
  readonly cached: Cached;
}): GeoService => {
  /** Runs one geo source call for `cached`. */
  const loadFromSource = <T, R>(
    call: () => ProviderResult<T>,
    wrap: (value: T) => R,
    notFoundMessage: string,
  ): (() => Promise<Result<R, ServiceError>>) =>
    loadFromProvider(source.id, call, wrap, notFoundMessage);

  const normalized = (text: string): string => text.trim().toLowerCase();

  return {
    countries: () =>
      cached({
        key: 'geo:countries',
        ttlMs: REFERENCE_TTL_MS,
        schema: listCountriesResponseSchema,
        load: loadFromSource(
          source.countries,
          (countries) => ({ countries: [...countries] }),
          'No countries found.',
        ),
      }),

    cities: ({ countryCode }) =>
      cached({
        key: `geo:cities:${countryCode}`,
        ttlMs: REFERENCE_TTL_MS,
        schema: listCitiesResponseSchema,
        load: loadFromSource(
          () => source.cities(countryCode),
          (cities) => ({ cities: [...cities] }),
          `We don't know a country ${countryCode}.`,
        ),
      }),

    cityPrices: ({ countryCode, cityName }, { from: fromDate, to }) =>
      cached({
        key: `geo:city-prices:${stableKey({ countryCode, city: normalized(cityName), fromDate, to })}`,
        ttlMs: PRICE_INDEX_TTL_MS,
        schema: cityPricesResponseSchema,
        load: loadFromSource(
          () =>
            source.cityPrices({ countryCode, cityName, from: fromDate, to }),
          (index) => index,
          `We have no prices for ${cityName}.`,
        ),
      }),

    searchPlaces: ({ q, type }) =>
      cached({
        key: `geo:places:${stableKey({ q: normalized(q), type })}`,
        ttlMs: REFERENCE_TTL_MS,
        schema: searchPlacesResponseSchema,
        load: loadFromSource(
          () => source.searchPlaces(q, type),
          (places) => ({ places: [...places] }),
          'No places match.',
        ),
      }),

    place: (placeId) =>
      cached({
        key: `geo:place:${placeId}`,
        ttlMs: REFERENCE_TTL_MS,
        schema: getPlaceResponseSchema,
        load: loadFromSource(
          () => source.place(placeId),
          (place) => ({ place }),
          'No such place.',
        ),
      }),

    airports: ({ q }) =>
      cached({
        key: `geo:airports:${normalized(q)}`,
        ttlMs: REFERENCE_TTL_MS,
        schema: searchAirportsResponseSchema,
        load: loadFromSource(
          () => source.airports(q),
          (airports) => ({ airports: rankAirports(airports, q) }),
          'No airports match.',
        ),
      }),
  };
};
