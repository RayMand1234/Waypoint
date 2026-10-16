import {
  createTripRequestSchema,
  createTripResponseSchema,
  getTripResponseSchema,
  listTripsResponseSchema,
  patchSelectionBookedRequestSchema,
  patchSelectionBookedResponseSchema,
  putPlanRequestSchema,
  putPlanResponseSchema,
  putSelectionRequestSchema,
  putSelectionResponseSchema,
  selectionParamsSchema,
  tripParamsSchema,
  updateTripRequestSchema,
  updateTripResponseSchema,
} from '@waypoint/contracts/trips';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { requireUserId } from '../http/locals.ts';
import { noContentSchema, route } from '../http/route.ts';
import type { TripsService } from '../services/trips.service.ts';

export type TripsController = {
  readonly list: RequestHandler;
  readonly create: RequestHandler;
  readonly get: RequestHandler;
  readonly update: RequestHandler;
  readonly remove: RequestHandler;
  readonly putPlan: RequestHandler;
  readonly putSelection: RequestHandler;
  readonly setBooked: RequestHandler;
};

const tripOnly = z.object({ params: tripParamsSchema });

export const createTripsController = (
  trips: TripsService,
): TripsController => ({
  list: route(listTripsResponseSchema, z.object({}), (_input, res) =>
    trips.list(requireUserId(res)),
  ),
  create: route(
    createTripResponseSchema,
    z.object({ body: createTripRequestSchema }),
    ({ body }, res) => trips.create(requireUserId(res), body),
    {
      successStatus: 201,
    },
  ),
  get: route(getTripResponseSchema, tripOnly, ({ params }, res) =>
    trips.get(requireUserId(res), params.id),
  ),
  update: route(
    updateTripResponseSchema,
    z.object({ params: tripParamsSchema, body: updateTripRequestSchema }),
    ({ params, body }, res) =>
      trips.update(requireUserId(res), params.id, body),
  ),
  remove: route(
    noContentSchema,
    tripOnly,
    ({ params }, res) => trips.remove(requireUserId(res), params.id),
    { successStatus: 204 },
  ),
  putPlan: route(
    putPlanResponseSchema,
    z.object({ params: tripParamsSchema, body: putPlanRequestSchema }),
    ({ params, body }, res) =>
      trips.putPlan(requireUserId(res), params.id, body.days),
  ),
  putSelection: route(
    putSelectionResponseSchema,
    z.object({
      params: selectionParamsSchema,
      body: putSelectionRequestSchema,
    }),
    ({ params, body }, res) =>
      trips.putSelection(requireUserId(res), params.id, params.kind, body),
  ),
  setBooked: route(
    patchSelectionBookedResponseSchema,
    z.object({
      params: selectionParamsSchema,
      body: patchSelectionBookedRequestSchema,
    }),
    ({ params, body }, res) =>
      trips.setBooked(requireUserId(res), params.id, params.kind, body.booked),
  ),
});
