import { err, ok, type Result } from '@waypoint/contracts/common';
import {
  selectionKindSchema,
  tripDaySchema,
  tripSelectionSchema,
  type CreateTripRequest,
  type SelectionKind,
  type StoredTripStatus,
  type TripDay,
  type TripDayInput,
  type TripDetail,
  type TripListItem,
  type TripSelection,
  type TripSpot,
} from '@waypoint/contracts/trips';
import { In, type DataSource, type EntityManager } from 'typeorm';
import {
  storedTripSchema,
  type StoredTrip,
  type TripChanges,
  type TripLookupError,
} from '../domain/trip.ts';
import type { UserId } from '../domain/userId.ts';
import {
  TripDayEntity,
  TripEntity,
  TripSelectionEntity,
  TripSpotEntity,
  TripStopEntity,
} from '../entities/index.ts';
import { groupBy } from '../lib/groupBy.ts';

// Every query is scoped to the caller's user id: another user's trip simply
// isn't found, so it can never be read, changed or even confirmed to exist.
// Rows come back as contract types (parsed, so a bad row is a loud 500), never
// as entities. Writes lock the trip row and run their check inside the same
// transaction, so two requests can't both act on a stale read.

type Lookup<T, E = never> = Promise<Result<T, E | TripLookupError>>;

export type TripsRepository = {
  readonly list: (userId: UserId) => Promise<TripListItem[]>;
  readonly find: (
    userId: UserId,
    tripId: string,
  ) => Promise<StoredTrip | undefined>;
  readonly findDetail: (
    userId: UserId,
    tripId: string,
  ) => Promise<TripDetail | undefined>;
  readonly create: (
    userId: UserId,
    input: CreateTripRequest,
  ) => Promise<StoredTrip>;
  /** `decide` sees the locked trip and returns the changes (or why not). `spots` replaces the picks when given. */
  readonly update: <E>(
    userId: UserId,
    tripId: string,
    decide: (trip: StoredTrip) => Result<TripChanges, E>,
    spots?: readonly TripSpot[],
  ) => Lookup<StoredTrip, E>;
  readonly remove: (userId: UserId, tripId: string) => Promise<boolean>;
  readonly replacePlan: <E>(
    userId: UserId,
    tripId: string,
    days: readonly TripDayInput[],
    check: (trip: StoredTrip) => Result<null, E>,
  ) => Lookup<TripDay[], E>;
  readonly upsertSelection: (
    userId: UserId,
    tripId: string,
    selection: TripSelection,
  ) => Lookup<TripSelection>;
  /** Sets or clears `booked_at`, then sets the trip status `nextStatus` derives — one transaction. */
  readonly setSelectionBooked: (
    userId: UserId,
    tripId: string,
    kind: SelectionKind,
    bookedAt: Date | null,
    nextStatus: (
      status: StoredTripStatus,
      selections: readonly TripSelection[],
    ) => StoredTripStatus,
  ) => Lookup<TripSelection>;
};

const TRIP_NOT_FOUND: TripLookupError = { type: 'trip-not-found' };
const SELECTION_NOT_FOUND: TripLookupError = { type: 'selection-not-found' };

/* ── entity → contract ─────────────────────────────────────────────────── */

const toStoredTrip = (entity: TripEntity): StoredTrip =>
  storedTripSchema.parse({
    id: entity.id,
    status: entity.status,
    styles: entity.styles,
    pace: entity.pace,
    destinationId: entity.destinationId,
    destinationName: entity.destinationName,
    startDate: entity.startDate,
    endDate: entity.endDate,
    originAirport: entity.originAirport,
    adults: entity.adults,
    childrenAges: entity.childrenAges,
    updatedAt: entity.updatedAt.toISOString(),
  });

const toDay = (day: TripDayEntity, stops: readonly TripStopEntity[]): TripDay =>
  tripDaySchema.parse({
    id: day.id,
    dayIndex: day.dayIndex,
    date: day.date,
    stops: stops
      .toSorted((a, b) => a.position - b.position)
      .map((stop) => ({
        id: stop.id,
        position: stop.position,
        spotId: stop.spotId,
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        startsAt: stop.startsAt.slice(0, 5),
        minutes: stop.minutes,
        travelMinutesFromPrevious: stop.travelMinutesFromPrevious,
        isFixed: stop.isFixed,
      })),
  });

const toSelection = (entity: TripSelectionEntity): TripSelection =>
  tripSelectionSchema.parse({
    kind: entity.kind,
    offerSnapshot: entity.offerSnapshot,
    provider: entity.provider,
    deepLink: entity.deepLink,
    price: { amountMinor: entity.priceMinor, currency: entity.currency },
    checkedAt: entity.checkedAt.toISOString(),
    bookedAt: entity.bookedAt?.toISOString() ?? null,
  });

/* ── queries ───────────────────────────────────────────────────────────── */

const findOwned = (
  manager: EntityManager,
  userId: UserId,
  tripId: string,
): Promise<TripEntity | null> =>
  manager.findOneBy(TripEntity, { id: tripId, userId });

/** The trip, locked until the transaction ends — writers queue behind each other. */
const lockOwned = (
  manager: EntityManager,
  userId: UserId,
  tripId: string,
): Promise<TripEntity | null> =>
  manager.findOne(TripEntity, {
    where: { id: tripId, userId },
    lock: { mode: 'pessimistic_write' },
  });

const touch = async (manager: EntityManager, tripId: string): Promise<void> => {
  await manager
    .createQueryBuilder()
    .update(TripEntity)
    .set({ updatedAt: () => 'now()' })
    .where('id = :tripId', { tripId })
    .execute();
};

const loadDays = async (
  manager: EntityManager,
  tripId: string,
): Promise<TripDay[]> => {
  const days = await manager.find(TripDayEntity, {
    where: { tripId },
    order: { dayIndex: 'ASC' },
  });
  const stops =
    days.length === 0
      ? []
      : await manager.findBy(TripStopEntity, {
          dayId: In(days.map((d) => d.id)),
        });
  const stopsByDay = groupBy(stops, (stop) => stop.dayId);

  return days.map((day) => toDay(day, stopsByDay.get(day.id) ?? []));
};

const loadSelections = async (
  manager: EntityManager,
  tripId: string,
): Promise<TripSelection[]> =>
  (
    await manager.find(TripSelectionEntity, {
      where: { tripId },
      order: { kind: 'ASC' },
    })
  ).map(toSelection);

const replaceSpots = async (
  manager: EntityManager,
  tripId: string,
  spots: readonly TripSpot[],
): Promise<void> => {
  await manager.delete(TripSpotEntity, { tripId });

  if (spots.length === 0) return;

  await manager.insert(
    TripSpotEntity,
    spots.map((spot, position) => ({
      tripId,
      spotId: spot.spotId,
      name: spot.name,
      position,
    })),
  );
};

export const createTripsRepository = (
  dataSource: DataSource,
): TripsRepository => ({
  list: async (userId) => {
    const trips = await dataSource.manager.find(TripEntity, {
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
    const tripIds = trips.map((trip) => trip.id);
    const [days, selections] =
      tripIds.length === 0
        ? [[], []]
        : await Promise.all([
            dataSource.manager.find(TripDayEntity, {
              select: { tripId: true },
              where: { tripId: In(tripIds) },
            }),
            dataSource.manager.find(TripSelectionEntity, {
              select: { tripId: true, kind: true },
              where: { tripId: In(tripIds) },
              order: { kind: 'ASC' },
            }),
          ]);
    const daysByTrip = groupBy(days, (day) => day.tripId);
    const selectionsByTrip = groupBy(
      selections,
      (selection) => selection.tripId,
    );

    return trips.map((trip) => ({
      ...toStoredTrip(trip),
      planDays: daysByTrip.get(trip.id)?.length ?? 0,
      selections: (selectionsByTrip.get(trip.id) ?? []).map((s) =>
        selectionKindSchema.parse(s.kind),
      ),
    }));
  },

  find: async (userId, tripId) => {
    const trip = await findOwned(dataSource.manager, userId, tripId);

    return trip === null ? undefined : toStoredTrip(trip);
  },

  findDetail: (userId, tripId) =>
    dataSource.transaction(async (manager) => {
      const trip = await findOwned(manager, userId, tripId);

      if (trip === null) return undefined;

      const spots = await manager.find(TripSpotEntity, {
        where: { tripId },
        order: { position: 'ASC' },
      });

      return {
        ...toStoredTrip(trip),
        spots: spots.map(({ spotId, name }) => ({ spotId, name })),
        days: await loadDays(manager, tripId),
        selections: await loadSelections(manager, tripId),
      };
    }),

  create: async (userId, input) =>
    toStoredTrip(
      await dataSource.manager.save(
        dataSource.manager.create(TripEntity, {
          userId,
          status: 'draft',
          styles: [...input.styles],
          pace: input.pace,
          destinationId: null,
          destinationName: null,
          startDate: null,
          endDate: null,
          originAirport: input.originAirport,
          adults: input.adults,
          childrenAges: [...input.childrenAges],
        }),
      ),
    ),

  update: (userId, tripId, decide, spots) =>
    dataSource.transaction(async (manager) => {
      const trip = await lockOwned(manager, userId, tripId);

      if (trip === null) return err(TRIP_NOT_FOUND);

      const changes = decide(toStoredTrip(trip));

      if (!changes.ok) return changes;

      const { styles, childrenAges, ...columns } = changes.value;

      await manager.update(
        TripEntity,
        { id: tripId },
        {
          ...columns,
          ...(styles === undefined ? {} : { styles: [...styles] }),
          ...(childrenAges === undefined
            ? {}
            : { childrenAges: [...childrenAges] }),
        },
      );

      if (spots !== undefined) await replaceSpots(manager, tripId, spots);

      await touch(manager, tripId);

      return ok(
        toStoredTrip(await manager.findOneByOrFail(TripEntity, { id: tripId })),
      );
    }),

  remove: async (userId, tripId) => {
    const result = await dataSource.manager.delete(TripEntity, {
      id: tripId,
      userId,
    });

    return (result.affected ?? 0) > 0;
  },

  replacePlan: (userId, tripId, days, check) =>
    dataSource.transaction(async (manager) => {
      const trip = await lockOwned(manager, userId, tripId);

      if (trip === null) return err(TRIP_NOT_FOUND);

      const valid = check(toStoredTrip(trip));

      if (!valid.ok) return valid;

      // Stops go with their days (FK cascade).
      await manager.delete(TripDayEntity, { tripId });

      for (const day of days) {
        const saved = await manager.save(
          manager.create(TripDayEntity, {
            tripId,
            dayIndex: day.dayIndex,
            date: day.date,
          }),
        );

        await manager.insert(
          TripStopEntity,
          day.stops.map((stop) => ({ ...stop, dayId: saved.id })),
        );
      }

      await touch(manager, tripId);

      return ok(await loadDays(manager, tripId));
    }),

  upsertSelection: (userId, tripId, selection) =>
    dataSource.transaction(async (manager) => {
      if ((await lockOwned(manager, userId, tripId)) === null)
        return err(TRIP_NOT_FOUND);

      await manager.save(
        manager.create(TripSelectionEntity, {
          tripId,
          kind: selection.kind,
          offerSnapshot: selection.offerSnapshot,
          provider: selection.provider,
          deepLink: selection.deepLink,
          priceMinor: selection.price.amountMinor,
          currency: selection.price.currency,
          checkedAt: new Date(selection.checkedAt),
          bookedAt:
            selection.bookedAt === null ? null : new Date(selection.bookedAt),
        }),
      );
      await touch(manager, tripId);

      return ok(
        toSelection(
          await manager.findOneByOrFail(TripSelectionEntity, {
            tripId,
            kind: selection.kind,
          }),
        ),
      );
    }),

  setSelectionBooked: (userId, tripId, kind, bookedAt, nextStatus) =>
    dataSource.transaction(async (manager) => {
      const trip = await lockOwned(manager, userId, tripId);

      if (trip === null) return err(TRIP_NOT_FOUND);

      const result = await manager.update(
        TripSelectionEntity,
        { tripId, kind },
        { bookedAt },
      );

      if ((result.affected ?? 0) === 0) return err(SELECTION_NOT_FOUND);

      const selections = await loadSelections(manager, tripId);
      const status = nextStatus(toStoredTrip(trip).status, selections);

      await manager.update(TripEntity, { id: tripId }, { status });
      await touch(manager, tripId);

      const selection = selections.find((s) => s.kind === kind);

      return selection === undefined ? err(SELECTION_NOT_FOUND) : ok(selection);
    }),
});
