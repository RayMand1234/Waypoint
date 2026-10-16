import { useLocalSearchParams } from 'expo-router';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.uuid().optional().catch(undefined),
  step: z.string().optional().catch(undefined),
});

/** Shown when the route's trip id isn't one (a broken or hand-typed link). */
export const NO_TRIP_MESSAGE = "We can't find that trip.";

/**
 * The `/trip/[id]/…` route's params, checked rather than assumed: a param can
 * be missing or repeated in a link. `tripId` is `undefined` when it isn't an id.
 */
export const useTripParams = (): {
  readonly tripId: string | undefined;
  readonly step: string | undefined;
} => {
  const { id, step } = paramsSchema.parse(useLocalSearchParams());

  return { tripId: id, step };
};
