import type { LatLng } from '../../lib/distance.ts';
import { scheduleCost, scheduleDay } from './schedule.ts';
import type { DayFrame, PlanSpot } from './types.ts';

// Which spots go on which day, in which order. Pure and deterministic: ties
// are broken by popularity, then id.
//
// 1. Regret insertion: place first the spot that loses most if it can't have
//    its best day (a museum open only on Tuesday, a far-out spot), each at the
//    cheapest feasible position of any day.
// 2. Upgrade: a dropped spot replaces a placed, less popular one when it fits,
//    so the days keep the most popular spots.
// 3. Improve: move single spots between days, or reverse part of a day's
//    route, while that lowers travel and evens out the days.

/** Each day's spots in visiting order, by frame index. */
export type Routes = readonly (readonly PlanSpot[])[];

export type Assignment = {
  readonly routes: Routes;
  /** Spots that don't fit, least popular first out. */
  readonly dropped: readonly PlanSpot[];
};

/** How much evening the days out counts against a little more travel. */
const BALANCE_WEIGHT = 0.2;
/** Improvements smaller than this aren't worth a move. */
const EPSILON = 0.5;
/** A safety stop for the improvement loop; real trips settle long before. */
const MAX_MOVES = 300;

type Planner = {
  readonly frames: readonly DayFrame[];
  readonly home: LatLng;
};

type Placement = {
  readonly day: number;
  readonly position: number;
  /** Added cost of placing the spot there. */
  readonly cost: number;
};

const byPopularity = (a: PlanSpot, b: PlanSpot): number =>
  b.popularity - a.popularity || a.id.localeCompare(b.id);

const insertAt = (
  route: readonly PlanSpot[],
  spot: PlanSpot,
  position: number,
): PlanSpot[] => [...route.slice(0, position), spot, ...route.slice(position)];

const without = (route: readonly PlanSpot[], spot: PlanSpot): PlanSpot[] =>
  route.filter((other) => other.id !== spot.id);

const replaceDay = (
  routes: Routes,
  day: number,
  route: readonly PlanSpot[],
): Routes => routes.map((other, index) => (index === day ? route : other));

/** A day's route cost, or `undefined` when it doesn't fit the day. */
const routeCost = (
  { frames, home }: Planner,
  day: number,
  route: readonly PlanSpot[],
): number | undefined => {
  const frame = frames[day];

  if (frame === undefined) return undefined;

  if (route.length === 0) return 0;

  const schedule = scheduleDay(frame, home, route, { strict: true });

  return schedule === undefined ? undefined : scheduleCost(schedule);
};

/** The cheapest feasible position for `spot` in each day it fits, cheapest day first. */
const placements = (
  planner: Planner,
  routes: Routes,
  spot: PlanSpot,
): Placement[] =>
  routes
    .flatMap((route, day): Placement[] => {
      const base = routeCost(planner, day, route);

      if (base === undefined) return [];

      const options = Array.from(
        { length: route.length + 1 },
        (_, position) => {
          const cost = routeCost(planner, day, insertAt(route, spot, position));

          return cost === undefined
            ? []
            : [{ day, position, cost: cost - base }];
        },
      ).flat();

      return options.reduce<Placement[]>(
        (best, option) =>
          best[0] === undefined || option.cost < best[0].cost ? [option] : best,
        [],
      );
    })
    .sort((a, b) => a.cost - b.cost || a.day - b.day);

const place = (routes: Routes, spot: PlanSpot, at: Placement): Routes =>
  replaceDay(routes, at.day, insertAt(routes[at.day] ?? [], spot, at.position));

const regretOf = (options: readonly Placement[]): number => {
  const [best, second] = options;

  if (best === undefined) return -Infinity;

  return second === undefined ? Infinity : second.cost - best.cost;
};

const insertAll = (
  planner: Planner,
  routes: Routes,
  unplaced: readonly PlanSpot[],
): Assignment => {
  const ranked = unplaced
    .map((spot) => ({ spot, options: placements(planner, routes, spot) }))
    .filter(({ options }) => options.length > 0)
    .sort(
      (a, b) =>
        regretOf(b.options) - regretOf(a.options) ||
        byPopularity(a.spot, b.spot),
    );
  const next = ranked[0];
  const first = next?.options[0];

  if (next === undefined || first === undefined)
    return { routes, dropped: [...unplaced].sort(byPopularity) };

  return insertAll(
    planner,
    place(routes, next.spot, first),
    unplaced.filter((spot) => spot.id !== next.spot.id),
  );
};

const dayOf = (routes: Routes, spot: PlanSpot): number =>
  routes.findIndex((route) => route.some((other) => other.id === spot.id));

/** A dropped spot takes the place of a placed, less popular one, while one fits. */
const upgrade = (planner: Planner, assignment: Assignment): Assignment => {
  const swap = assignment.dropped
    .flatMap((dropped) =>
      assignment.routes
        .flat()
        .filter((placed) => placed.popularity < dropped.popularity)
        .sort((a, b) => byPopularity(b, a))
        .map((placed) => ({ dropped, placed })),
    )
    .map(({ dropped, placed }) => {
      const day = dayOf(assignment.routes, placed);
      const routes = replaceDay(
        assignment.routes,
        day,
        without(assignment.routes[day] ?? [], placed),
      );
      const option = placements(planner, routes, dropped)[0];

      return option === undefined
        ? undefined
        : { routes: place(routes, dropped, option), dropped, placed };
    })
    .find((candidate) => candidate !== undefined);

  if (swap === undefined) return assignment;

  return upgrade(planner, {
    routes: swap.routes,
    dropped: [
      ...assignment.dropped.filter((spot) => spot.id !== swap.dropped.id),
      swap.placed,
    ].sort(byPopularity),
  });
};

/** All days' travel, plus how unevenly full they are. */
const totalCost = (planner: Planner, routes: Routes): number => {
  const costs = routes.map((route, day) => routeCost(planner, day, route) ?? 0);
  const loads = routes.map((route) =>
    route.reduce((sum, spot) => sum + spot.visitMinutes, 0),
  );
  const open = planner.frames.filter((frame) => frame.budget > 0).length;
  const mean = loads.reduce((sum, load) => sum + load, 0) / Math.max(open, 1);
  const unevenness = loads
    .filter((_, day) => (planner.frames[day]?.budget ?? 0) > 0)
    .reduce((sum, load) => sum + Math.abs(load - mean), 0);

  return (
    costs.reduce((sum, cost) => sum + cost, 0) + BALANCE_WEIGHT * unevenness
  );
};

/** A route with its stretch `i..j-1` reversed (2-opt). */
const reversedStretch = (
  route: readonly PlanSpot[],
  i: number,
  j: number,
): PlanSpot[] => [
  ...route.slice(0, i),
  ...route.slice(i, j).reverse(),
  ...route.slice(j),
];

/** Each way to reverse a stretch of at least two stops. */
function* reversals(
  route: readonly PlanSpot[],
): Generator<readonly PlanSpot[]> {
  for (let i = 0; i < route.length - 1; i += 1)
    for (let j = i + 2; j <= route.length; j += 1)
      yield reversedStretch(route, i, j);
}

/**
 * Every route one move away — a spot to another day, or part of a day's route
 * reversed — produced one at a time, so the search can stop at the first that helps.
 */
function* neighbours(planner: Planner, routes: Routes): Generator<Routes> {
  for (const [day, route] of routes.entries()) {
    for (const spot of route) {
      const lifted = replaceDay(routes, day, without(route, spot));

      for (const option of placements(planner, lifted, spot))
        if (option.day !== day) yield place(lifted, spot, option);
    }

    for (const reversed of reversals(route))
      yield replaceDay(routes, day, reversed);
  }
}

const firstWhere = <T>(
  items: Iterable<T>,
  test: (item: T) => boolean,
): T | undefined => {
  for (const item of items) if (test(item)) return item;

  return undefined;
};

const improve = (
  planner: Planner,
  routes: Routes,
  movesLeft: number,
): Routes => {
  if (movesLeft === 0) return routes;

  const current = totalCost(planner, routes);
  const better = firstWhere(
    neighbours(planner, routes),
    (candidate) =>
      candidate.every(
        (route, day) => routeCost(planner, day, route) !== undefined,
      ) && totalCost(planner, candidate) < current - EPSILON,
  );

  return better === undefined
    ? routes
    : improve(planner, better, movesLeft - 1);
};

/** Groups the spots into the days and orders each day. */
export const assignSpots = (
  frames: readonly DayFrame[],
  home: LatLng,
  spots: readonly PlanSpot[],
): Assignment => {
  const planner = { frames, home };
  const inserted = insertAll(
    planner,
    frames.map(() => []),
    [...spots].sort(byPopularity),
  );
  const upgraded = upgrade(planner, inserted);

  return {
    routes: improve(planner, upgraded.routes, MAX_MOVES),
    dropped: upgraded.dropped,
  };
};

/**
 * Orders a day the traveler arranged by hand: nearest first from the stay,
 * then reversals while they shorten the route. Nothing is dropped.
 */
export const orderDay = (
  frame: DayFrame,
  home: LatLng,
  spots: readonly PlanSpot[],
): readonly PlanSpot[] => {
  const nearestFirst = (
    from: LatLng,
    left: readonly PlanSpot[],
  ): PlanSpot[] => {
    const next = [...left].sort(
      (a, b) =>
        Math.hypot(a.lat - from.lat, a.lng - from.lng) -
          Math.hypot(b.lat - from.lat, b.lng - from.lng) ||
        a.id.localeCompare(b.id),
    )[0];

    return next === undefined
      ? []
      : [next, ...nearestFirst(next, without(left, next))];
  };
  const loose = (route: readonly PlanSpot[]): number => {
    const schedule = scheduleDay(frame, home, route, { strict: false });

    return schedule === undefined ? Infinity : scheduleCost(schedule);
  };
  const shorten = (route: readonly PlanSpot[]): readonly PlanSpot[] => {
    const better = firstWhere(
      reversals(route),
      (candidate) => loose(candidate) < loose(route) - EPSILON,
    );

    return better === undefined ? route : shorten(better);
  };

  return shorten(nearestFirst(home, spots));
};
