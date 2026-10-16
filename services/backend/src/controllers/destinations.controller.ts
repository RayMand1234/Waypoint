import {
  addDestinationBodySchema,
  destinationParamsSchema,
  getDestinationResponseSchema,
  getSpotRatingResponseSchema,
  getSpotResponseSchema,
  listDestinationsQuerySchema,
  listDestinationsResponseSchema,
  listSpotsQuerySchema,
  listSpotsResponseSchema,
  spotParamsSchema,
} from '@waypoint/contracts/destinations';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { route } from '../http/route.ts';
import type { DestinationsService } from '../services/destinations.service.ts';

export type DestinationsController = {
  readonly list: RequestHandler;
  readonly add: RequestHandler;
  readonly get: RequestHandler;
  readonly spots: RequestHandler;
  readonly spot: RequestHandler;
  readonly rating: RequestHandler;
};

export const createDestinationsController = (
  destinations: DestinationsService,
): DestinationsController => ({
  list: route(
    listDestinationsResponseSchema,
    z.object({ query: listDestinationsQuerySchema }),
    ({ query }) => destinations.list(query),
  ),
  add: route(
    getDestinationResponseSchema,
    z.object({ body: addDestinationBodySchema }),
    ({ body }) => destinations.add(body),
  ),
  get: route(
    getDestinationResponseSchema,
    z.object({ params: destinationParamsSchema }),
    ({ params }) => destinations.get(params.destinationId),
  ),
  spots: route(
    listSpotsResponseSchema,
    z.object({ params: destinationParamsSchema, query: listSpotsQuerySchema }),
    ({ params, query }) => destinations.spots(params.destinationId, query),
  ),
  spot: route(
    getSpotResponseSchema,
    z.object({ params: spotParamsSchema }),
    ({ params }) => destinations.spot(params.spotId),
  ),
  rating: route(
    getSpotRatingResponseSchema,
    z.object({ params: spotParamsSchema }),
    ({ params }) => destinations.rating(params.spotId),
  ),
});
