import {
  getHotelResponseSchema,
  getHotelReviewsResponseSchema,
  hotelParamsSchema,
  hotelSearchRequestSchema,
  hotelSearchResponseSchema,
  listHotelsQuerySchema,
  listHotelsResponseSchema,
} from '@waypoint/contracts/hotels';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { route } from '../http/route.ts';
import type { HotelsService } from '../services/hotels.service.ts';

export type HotelsController = {
  readonly list: RequestHandler;
  readonly detail: RequestHandler;
  readonly reviews: RequestHandler;
  readonly search: RequestHandler;
};

export const createHotelsController = (
  hotels: HotelsService,
): HotelsController => ({
  list: route(
    listHotelsResponseSchema,
    z.object({ query: listHotelsQuerySchema }),
    ({ query }) => hotels.list(query),
  ),
  detail: route(
    getHotelResponseSchema,
    z.object({ params: hotelParamsSchema }),
    ({ params }) => hotels.detail(params.hotelId),
  ),
  reviews: route(
    getHotelReviewsResponseSchema,
    z.object({ params: hotelParamsSchema }),
    ({ params }) => hotels.reviews(params.hotelId),
  ),
  search: route(
    hotelSearchResponseSchema,
    z.object({ body: hotelSearchRequestSchema }),
    ({ body }) => hotels.search(body),
  ),
});
