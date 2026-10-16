import { assertNever, err, type Result } from '@waypoint/contracts/common';
import type { TripLookupError } from '../domain/trip.ts';
import { notFound, type ServiceError } from './errors.ts';

// Another user's trip is "not found", never "forbidden": its existence is not ours to confirm.
export const TRIP_NOT_FOUND = notFound('We have no trip with that id.');
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

/** A trip repository result as a service result. */
export const mapTripError = <T>(
  result: Result<T, TripLookupError | ServiceError>,
): Result<T, ServiceError> =>
  result.ok ? result : err(toServiceError(result.error));
