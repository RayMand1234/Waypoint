import { assertNever, err, ok, type Result } from '@waypoint/contracts/common';
import {
  offerSnapshotSchemas,
  type CreateTripRequest,
  type ListTripsResponse,
  type PutPlanResponse,
  type PutSelectionRequest,
  type SelectionKind,
  type Trip,
  type TripDayInput,
  type TripDetail,
  type TripSelection,
  type UpdateTripRequest,
} from '@waypoint/contracts/trips';
import type { TripLookupError } from '../domain/trip.ts';
import type { UserId } from '../domain/userId.ts';
import type { TripsRepository } from '../repositories/trips.repository.ts';
import { invalidRequest, notFound, type ServiceError } from './errors.ts';
import {
  planTripUpdate,
  statusAfterBooking,
  validatePlan,
  withEffectiveStatus,
} from './trips.logic.ts';

type Outcome<T> = Promise<Result<T, ServiceError>>;

export type TripsService = {
  readonly list: (userId: UserId) => Outcome<ListTripsResponse>;
  readonly get: (userId: UserId, tripId: string) => Outcome<TripDetail>;
  readonly create: (userId: UserId, input: CreateTripRequest) => Outcome<Trip>;
  readonly update: (
    userId: UserId,
    tripId: string,
    patch: UpdateTripRequest,
  ) => Outcome<Trip>;
  readonly remove: (userId: UserId, tripId: string) => Outcome<null>;
  readonly putPlan: (
    userId: UserId,
    tripId: string,
    days: readonly TripDayInput[],
  ) => Outcome<PutPlanResponse>;
  readonly putSelection: (
    userId: UserId,
    tripId: string,
    kind: SelectionKind,
    input: PutSelectionRequest,
  ) => Outcome<TripSelection>;
  readonly setBooked: (
    userId: UserId,
    tripId: string,
    kind: SelectionKind,
    booked: boolean,
  ) => Outcome<TripSelection>;
};

// Another user's trip is "not found", never "forbidden": its existence is not ours to confirm.
const TRIP_NOT_FOUND = notFound('We have no trip with that id.');
const SELECTION_NOT_FOUND = notFound(
  'This trip has no selection of that kind yet.',
);

/** A repository lookup failure, or an error a trip rule already returned. */
const toServiceError = (
  error: TripLookupError | ServiceError,
): ServiceError => {
  switch (error.type) {
    case 'trip-not-found':
      return TRIP_NOT_FOUND;
    case 'selection-not-found':
      return SELECTION_NOT_FOUND;
    case 'not-found':
    case 'invalid-request':
    case 'conflict':
    case 'upstream-timeout':
    case 'upstream-unavailable':
      return error;
    default:
      return assertNever(error);
  }
};

const mapError = <T>(
  result: Result<T, TripLookupError | ServiceError>,
): Result<T, ServiceError> =>
  result.ok ? result : err(toServiceError(result.error));

export const createTripsService = ({
  trips,
  now,
}: {
  readonly trips: TripsRepository;
  readonly now: () => Date;
}): TripsService => ({
  list: async (userId) => {
    const at = now();

    return ok({
      trips: (await trips.list(userId)).map((trip) =>
        withEffectiveStatus(trip, at),
      ),
    });
  },

  get: async (userId, tripId) => {
    const trip = await trips.findDetail(userId, tripId);

    return trip === undefined
      ? err(TRIP_NOT_FOUND)
      : ok(withEffectiveStatus(trip, now()));
  },

  create: async (userId, input) =>
    ok(withEffectiveStatus(await trips.create(userId, input), now())),

  update: async (userId, tripId, patch) => {
    const updated = mapError(
      await trips.update(
        userId,
        tripId,
        (current) => planTripUpdate(current, patch),
        patch.spots,
      ),
    );

    return updated.ok ? ok(withEffectiveStatus(updated.value, now())) : updated;
  },

  remove: async (userId, tripId) =>
    (await trips.remove(userId, tripId)) ? ok(null) : err(TRIP_NOT_FOUND),

  putPlan: async (userId, tripId, days) => {
    const saved = mapError(
      await trips.replacePlan(userId, tripId, days, (trip) =>
        validatePlan(trip, days),
      ),
    );

    return saved.ok ? ok({ days: saved.value }) : saved;
  },

  // A newly chosen offer starts unbooked, even if the previous one was booked.
  putSelection: async (userId, tripId, kind, input) => {
    if (!offerSnapshotSchemas[kind].safeParse(input.offerSnapshot).success)
      return err(invalidRequest(`offerSnapshot is not a ${kind} offer.`));

    return mapError(
      await trips.upsertSelection(userId, tripId, {
        ...input,
        kind,
        bookedAt: null,
      }),
    );
  },

  setBooked: async (userId, tripId, kind, booked) =>
    mapError(
      await trips.setSelectionBooked(
        userId,
        tripId,
        kind,
        booked ? now() : null,
        statusAfterBooking,
      ),
    ),
});
