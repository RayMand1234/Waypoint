import {
  countryCodeSchema,
  iataCodeSchema,
  isoDateSchema,
  ok,
} from '@waypoint/contracts/common';
import type {
  Airport,
  City,
  Country,
  PlaceSuggestion,
} from '@waypoint/contracts/geo';
import { toMoney } from '../../lib/money.ts';
import type { Logger } from '../../observability/logger.ts';
import type { GeoSource } from '../types.ts';
import type { LiteApiClient } from './client.ts';
import { logDropped, parseEach } from './parse.ts';
import {
  listEnvelope,
  rawAirport,
  rawAirportGroup,
  rawCity,
  rawCityPrices,
  rawCountry,
  rawPlaceEnvelope,
  rawPlaceSuggestion,
} from './schemas.ts';

const byName = <T extends { readonly name: string }>(a: T, b: T): number =>
  a.name.localeCompare(b.name);

/** First occurrence wins. */
const unique = <T>(items: readonly T[], keyOf: (item: T) => string): T[] =>
  items.filter(
    (item, index) =>
      items.findIndex((other) => keyOf(other) === keyOf(item)) === index,
  );

/** liteAPI's countries, cities, places (Google Places), airports and city price index. */
export const createLiteApiGeo = ({
  client,
  logger,
}: {
  readonly client: LiteApiClient;
  readonly logger: Logger;
}): GeoSource => {
  return {
    id: 'liteapi',

    countries: async () => {
      const response = await client.get('/data/countries', {}, listEnvelope);

      if (!response.ok) return response;

      const { items, dropped } = parseEach(
        rawCountry,
        response.value.data ?? [],
      );
      const countries = items.flatMap((raw): Country[] => {
        const code = countryCodeSchema.safeParse(raw.code);

        return code.success ? [{ code: code.data, name: raw.name }] : [];
      });

      logDropped(
        logger,
        'countries',
        dropped + items.length - countries.length,
        countries.length,
      );

      return ok(unique(countries, (c) => c.code).sort(byName));
    },

    cities: async (countryCode) => {
      const response = await client.get(
        '/data/cities',
        { countryCode },
        listEnvelope,
      );

      if (!response.ok) return response;

      const { items, dropped } = parseEach(rawCity, response.value.data ?? []);
      const cities = items.map((raw): City => ({
        name: raw.city,
        countryCode,
      }));

      logDropped(logger, 'cities', dropped, cities.length);

      return ok(unique(cities, (c) => c.name.toLowerCase()).sort(byName));
    },

    searchPlaces: async (textQuery, type) => {
      const response = await client.get(
        '/data/places',
        { textQuery, type, language: 'en' },
        listEnvelope,
      );

      if (!response.ok) return response;

      const { items, dropped } = parseEach(
        rawPlaceSuggestion,
        response.value.data ?? [],
      );

      logDropped(logger, 'places', dropped, items.length);

      return ok(
        items.map((raw): PlaceSuggestion => ({
          placeId: raw.placeId,
          name: raw.displayName,
          address: raw.formattedAddress ?? '',
          types: raw.types ?? [],
        })),
      );
    },

    place: async (placeId) => {
      const response = await client.get(
        `/data/places/${encodeURIComponent(placeId)}`,
        { language: 'en' },
        rawPlaceEnvelope,
      );

      if (!response.ok) return response;

      const { data } = response.value;
      const countryCode = countryCodeSchema.safeParse(
        data.addressComponents?.find((part) => part.types?.includes('country'))
          ?.shortText,
      );

      return ok({
        placeId,
        name: data.displayName,
        lat: data.location.latitude,
        lng: data.location.longitude,
        countryCode: countryCode.success ? countryCode.data : null,
        viewport:
          data.viewport == null
            ? null
            : {
                north: data.viewport.high.latitude,
                south: data.viewport.low.latitude,
                east: data.viewport.high.longitude,
                west: data.viewport.low.longitude,
              },
        types: data.types ?? [],
      });
    },

    airports: async (q) => {
      const response = await client.get(
        // The trailing slash is liteAPI's canonical path; without it every search pays a redirect.
        '/data/flights/airports/',
        { q },
        listEnvelope,
      );

      if (!response.ok) return response;

      const groups = parseEach(rawAirportGroup, response.value.data ?? []);
      const { items, dropped } = parseEach(
        rawAirport,
        groups.items.flatMap((group) => group.airports ?? []),
      );
      const airports = items.flatMap((raw): Airport[] => {
        const iata = iataCodeSchema.safeParse(raw.iata.toUpperCase());

        return iata.success
          ? [
              {
                iata: iata.data,
                name: raw.name,
                city: raw.city ?? null,
                country: raw.country ?? null,
                lat: raw.lat ?? null,
                lng: raw.lon ?? null,
              },
            ]
          : [];
      });

      logDropped(logger, 'airports', groups.dropped + dropped, airports.length);

      return ok(unique(airports, (a) => a.iata));
    },

    cityPrices: async ({ countryCode, cityName, from, to }) => {
      const response = await client.get(
        '/prices/city',
        { countryCode, cityName, fromDate: from, toDate: to },
        rawCityPrices,
      );

      if (!response.ok) return response;

      const days = (response.value.prices ?? []).flatMap((raw) => {
        const date = isoDateSchema.safeParse(raw.day.slice(0, 10));
        const price =
          raw.avgPriceUsd > 0 ? toMoney(raw.avgPriceUsd, 'USD') : undefined;

        return date.success && price !== undefined
          ? [{ date: date.data, averagePerNight: price }]
          : [];
      });
      const total = days.reduce(
        (sum, day) => sum + day.averagePerNight.amountMinor,
        0,
      );

      return ok({
        countryCode,
        cityName,
        averagePerNight:
          days.length === 0
            ? null
            : {
                amountMinor: Math.round(total / days.length),
                currency: 'USD' as const,
              },
        days,
      });
    },
  } satisfies GeoSource;
};
