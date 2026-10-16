import {
  getMeResponseSchema,
  updateMeRequestSchema,
  updateMeResponseSchema,
} from '@waypoint/contracts/trips';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { requireUserId } from '../http/locals.ts';
import { route } from '../http/route.ts';
import type { ProfileService } from '../services/profile.service.ts';

export type MeController = {
  readonly get: RequestHandler;
  readonly update: RequestHandler;
};

export const createMeController = (profiles: ProfileService): MeController => ({
  get: route(getMeResponseSchema, z.object({}), (_input, res) =>
    profiles.me(requireUserId(res)),
  ),
  update: route(
    updateMeResponseSchema,
    z.object({ body: updateMeRequestSchema }),
    ({ body }, res) => profiles.update(requireUserId(res), body),
  ),
});
