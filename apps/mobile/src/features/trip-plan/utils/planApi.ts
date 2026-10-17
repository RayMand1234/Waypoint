import {
  buildPlanResponseSchema,
  type BuildPlanRequest,
  type BuildPlanResponse,
} from '@waypoint/contracts/trips';
import { apiRequest } from '@/shared/utils/apiClient';

/**
 * Builds and saves the trip's day plan. Without `days` the planner groups the
 * spots itself; with them it keeps the traveler's days and order and only
 * times them.
 */
export const buildPlan = (
  tripId: string,
  request: BuildPlanRequest,
): Promise<BuildPlanResponse> =>
  apiRequest(
    `/trips/${encodeURIComponent(tripId)}/plan`,
    buildPlanResponseSchema,
    { method: 'POST', body: request },
  );
