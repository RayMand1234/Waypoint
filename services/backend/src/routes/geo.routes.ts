import { Router } from 'express';
import type { GeoController } from '../controllers/geo.controller.ts';

export const createGeoRouter = (geo: GeoController): Router =>
  Router()
    .get('/countries', geo.countries)
    .get('/countries/:countryCode/cities', geo.cities)
    .get('/countries/:countryCode/cities/:cityName/prices', geo.cityPrices)
    .get('/places', geo.searchPlaces)
    .get('/places/:placeId', geo.place)
    .get('/airports', geo.airports);
