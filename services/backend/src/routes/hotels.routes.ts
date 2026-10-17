import { Router } from 'express';
import type { HotelsController } from '../controllers/hotels.controller.ts';

export const createHotelsRouter = (hotels: HotelsController): Router =>
  Router()
    .get('/hotels', hotels.list)
    .post('/hotels/search', hotels.search)
    .get('/hotels/:hotelId', hotels.detail)
    .get('/hotels/:hotelId/reviews', hotels.reviews);
