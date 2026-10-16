import { err, ok, type IsoDate, type Result } from '@waypoint/contracts/common';
import type {
  StoredTripStatus,
  TripDayInput,
  TripSelection,
  TripStatus,
  UpdateTripRequest,
} from '@waypoint/contracts/trips';
import type { StoredTrip, TripChanges } from '../domain/trip.ts';
import { utcDate } from '../lib/dates.ts';
import { conflict, invalidRequest, type ServiceError } from './errors.ts';

// Pure trip rules: no I/O, `now` passed in.

/**
 * Status changes a traveler may make by hand. `booked` is never set by hand:
 * it follows ticking selections as booked (`statusAfterBooking`). `past` is
 * never stored at all.
 */
const ALLOWED: Readonly<Record<StoredTripStatus, readonly StoredTripStatus[]>> =
  {
    draft: ['planned'],
    planned: ['draft'],
    booked: [],
  };

/** A trip whose end date has gone by reads as `past` (drafts stay drafts). */
export const effectiveStatus = (
  trip: { readonly status: TripStatus; readonly endDate: IsoDate | null },
  now: Date,
): TripStatus =>
  trip.status !== 'draft' &&
  trip.endDate !== null &&
  trip.endDate < utcDate(now)
    ? 'past'
    : trip.status;

export const withEffectiveStatus = <
  T extends { readonly status: TripStatus; readonly endDate: IsoDate | null },
>(
  trip: T,
  now: Date,
): Omit<T, 'status'> & { readonly status: TripStatus } => ({
  ...trip,
  status: effectiveStatus(trip, now),
});

/** A field after a PATCH: absent keeps the stored value, `null` clears it. */
const resolved = <T>(patched: T | undefined, current: T): T =>
  // Not `??`: that would treat an explicit `null` ("clear it") as "keep the stored value".
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  patched === undefined ? current : patched;

/**
 * Checks a PATCH against the trip as stored and turns it into the changes to
 * persist. Checks the trip as it will be after the change, so clearing a
 * field can't sneak past a rule that a status change would have hit.
 */
export const planTripUpdate = (
  current: StoredTrip,
  patch: UpdateTripRequest,
): Result<TripChanges, ServiceError> => {
  const { spots: _spots, ...changes } = patch;
  const status = resolved(patch.status, current.status);
  const destinationId = resolved(patch.destinationId, current.destinationId);
  const startDate = resolved(patch.startDate, current.startDate);
  const endDate = resolved(patch.endDate, current.endDate);

  if (status !== current.status && !ALLOWED[current.status].includes(status)) {
    return err(
      conflict(`A trip can't go from ${current.status} to ${status}.`),
    );
  }

  if (status !== 'draft' && destinationId === null) {
    return err(conflict('A planned trip needs a destination.'));
  }

  if (startDate !== null && endDate !== null && endDate < startDate) {
    return err(invalidRequest('endDate must not be before startDate.'));
  }

  return ok(changes);
};

/**
 * Checks a day plan: day indexes unique, stop positions unique within a day,
 * and every day inside the trip's dates when the trip has them.
 */
export const validatePlan = (
  trip: StoredTrip,
  days: readonly TripDayInput[],
): Result<null, ServiceError> => {
  const hasDuplicates = (values: readonly number[]): boolean =>
    new Set(values).size !== values.length;

  if (hasDuplicates(days.map((day) => day.dayIndex))) {
    return err(invalidRequest('Each day needs its own dayIndex.'));
  }

  if (
    days.some((day) => hasDuplicates(day.stops.map((stop) => stop.position)))
  ) {
    return err(invalidRequest('Stops in a day need distinct positions.'));
  }

  const outside = days.find(
    (day) =>
      (trip.startDate !== null && day.date < trip.startDate) ||
      (trip.endDate !== null && day.date > trip.endDate),
  );

  return outside === undefined
    ? ok(null)
    : err(invalidRequest(`Day ${outside.date} is outside the trip's dates.`));
};

/**
 * The status after a selection is ticked or unticked as booked: a planned trip
 * with anything booked becomes `booked`; a booked trip with nothing booked
 * goes back to `planned`. Otherwise unchanged.
 */
export const statusAfterBooking = (
  status: StoredTripStatus,
  selections: readonly Pick<TripSelection, 'bookedAt'>[],
): StoredTripStatus => {
  const anyBooked = selections.some((selection) => selection.bookedAt !== null);

  if (status === 'planned' && anyBooked) return 'booked';

  if (status === 'booked' && !anyBooked) return 'planned';

  return status;
};
