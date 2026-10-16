import {
  buildPlanRequestSchema,
  buildPlanResponseSchema,
  tripParamsSchema,
} from '@waypoint/contracts/trips';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { requireUserId } from '../http/locals.ts';
import { route } from '../http/route.ts';
import type { PlansService } from '../services/plans.service.ts';

export type PlansController = {
  readonly build: RequestHandler;
};

export const createPlansController = (
  plans: PlansService,
): PlansController => ({
  build: route(
    buildPlanResponseSchema,
    z.object({ params: tripParamsSchema, body: buildPlanRequestSchema }),
    ({ params, body }, res) => plans.build(requireUserId(res), params.id, body),
  ),
});
