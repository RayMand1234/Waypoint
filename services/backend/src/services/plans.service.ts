import { err, ok, type Result } from '@waypoint/contracts/common';
import type {
  BuildPlanRequest,
  BuildPlanResponse,
  TripDayInput,
  TripDetail,
} from '@waypoint/contracts/trips';
import type { UserId } from '../domain/userId.ts';
import type { DestinationsRepository } from '../repositories/destinations.repository.ts';
import type { TripsRepository } from '../repositories/trips.repository.ts';
import { invalidRequest, type ServiceError } from './errors.ts';
import { dayFrames } from './planner/frames.ts';
import { arrangePlan, buildPlan, type DayArrangement } from './planner/plan.ts';
import { tripPlanInput } from './planner/tripFrame.ts';
import type { PlanSpot } from './planner/types.ts';
import { mapTripError, TRIP_NOT_FOUND } from './tripErrors.ts';
import { validatePlan } from './trips.logic.ts';

type Outcome<T> = Promise<Result<T, ServiceError>>;

export type PlansService = {
  /** Builds the trip's day plan (or times the traveler's own arrangement) and saves it. */
  readonly build: (
    userId: UserId,
    tripId: string,
    request: BuildPlanRequest,
  ) => Outcome<BuildPlanResponse>;
};

const NO_DATES = invalidRequest(
  'Set the trip’s dates before planning its days.',
);
const NO_DESTINATION = invalidRequest('Pick a destination before planning.');

/** The traveler's arrangement, as the planner's spots by date; unknown ids are left out (and lunch's place counts only the known). */
const arrangementByDate = (
  days: NonNullable<BuildPlanRequest['days']>,
  spots: readonly PlanSpot[],
): ReadonlyMap<string, DayArrangement> => {
  const known = (ids: readonly string[]): PlanSpot[] =>
    ids.flatMap((id) => spots.filter((spot) => spot.id === id));

  return new Map(
    days.map(({ date, spotIds, lunchAfter }) => [
      date,
      {
        spots: known(spotIds),
        lunchAfter:
          lunchAfter === undefined
            ? undefined
            : known(spotIds.slice(0, lunchAfter)).length,
      },
    ]),
  );
};

/** The spot ids each day of the saved plan has. */
const savedSpotIds = (
  days: TripDetail['days'],
): ReadonlyMap<string, ReadonlySet<string>> =>
  new Map(
    days.map((day) => [
      day.date,
      new Set(day.stops.flatMap((stop) => stop.spotId ?? [])),
    ]),
  );

export const createPlansService = ({
  trips,
  destinations,
}: {
  readonly trips: TripsRepository;
  readonly destinations: DestinationsRepository;
}): PlansService => ({
  build: async (userId, tripId, request) => {
    const trip = await trips.findDetail(userId, tripId);

    if (trip === undefined) return err(TRIP_NOT_FOUND);

    if (trip.destinationId === null) return err(NO_DESTINATION);

    const destination = await destinations.findOffered(trip.destinationId);

    if (destination === undefined) return err(NO_DESTINATION);

    const input = tripPlanInput(trip, destination);

    if (input === undefined) return err(NO_DATES);

    const spots: PlanSpot[] = await destinations.spotsByIds(
      trip.spots.map((spot) => spot.spotId),
    );
    const frames = dayFrames(input.frame);
    const days: readonly TripDayInput[] =
      request.days === undefined
        ? buildPlan(frames, input.home, spots).days
        : arrangePlan(
            frames,
            input.home,
            arrangementByDate(request.days, spots),
            savedSpotIds(trip.days),
          );
    const saved = mapTripError(
      await trips.replacePlan(userId, tripId, days, (stored) =>
        validatePlan(stored, days),
      ),
    );

    return saved.ok ? ok({ days: saved.value }) : saved;
  },
});
