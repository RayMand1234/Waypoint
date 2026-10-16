import {
  cityParamsSchema,
  cityPricesQuerySchema,
  cityPricesResponseSchema,
  countryParamsSchema,
  getPlaceResponseSchema,
  listCitiesResponseSchema,
  listCountriesResponseSchema,
  placeParamsSchema,
  searchAirportsQuerySchema,
  searchAirportsResponseSchema,
  searchPlacesQuerySchema,
  searchPlacesResponseSchema,
} from '@waypoint/contracts/geo';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { route } from '../http/route.ts';
import type { GeoService } from '../services/geo.service.ts';

export type GeoController = {
  readonly countries: RequestHandler;
  readonly cities: RequestHandler;
  readonly cityPrices: RequestHandler;
  readonly searchPlaces: RequestHandler;
  readonly place: RequestHandler;
  readonly airports: RequestHandler;
};

export const createGeoController = (geo: GeoService): GeoController => ({
  countries: route(listCountriesResponseSchema, z.object({}), () =>
    geo.countries(),
  ),
  cities: route(
    listCitiesResponseSchema,
    z.object({ params: countryParamsSchema }),
    ({ params }) => geo.cities(params),
  ),
  cityPrices: route(
    cityPricesResponseSchema,
    z.object({ params: cityParamsSchema, query: cityPricesQuerySchema }),
    ({ params, query }) => geo.cityPrices(params, query),
  ),
  searchPlaces: route(
    searchPlacesResponseSchema,
    z.object({ query: searchPlacesQuerySchema }),
    ({ query }) => geo.searchPlaces(query),
  ),
  place: route(
    getPlaceResponseSchema,
    z.object({ params: placeParamsSchema }),
    ({ params }) => geo.place(params.placeId),
  ),
  airports: route(
    searchAirportsResponseSchema,
    z.object({ query: searchAirportsQuerySchema }),
    ({ query }) => geo.airports(query),
  ),
});
