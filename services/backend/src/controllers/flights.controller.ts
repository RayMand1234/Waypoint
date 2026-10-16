import {
  flightSearchRequestSchema,
  flightSearchResponseSchema,
} from '@waypoint/contracts/flights';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { route } from '../http/route.ts';
import type { FlightsService } from '../services/flights.service.ts';

export type FlightsController = { readonly search: RequestHandler };

export const createFlightsController = (
  flights: FlightsService,
): FlightsController => ({
  search: route(
    flightSearchResponseSchema,
    z.object({ body: flightSearchRequestSchema }),
    ({ body }) => flights.search(body),
  ),
});
