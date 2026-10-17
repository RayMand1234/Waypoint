import {
  isoDateSchema,
  isoTimeSchema,
  type IsoDate,
} from '@waypoint/contracts/common';
import { describe, expect, it } from 'vitest';
import { assignSpots } from './assign.ts';
import { at, minutesOf } from './clock.ts';
import { dayFrames, type TravelFrame } from './frames.ts';
import { arrangePlan, buildPlan } from './plan.ts';
import { scheduleDay, visitStart } from './schedule.ts';
import type { DayFrame, PlanSpot } from './types.ts';

const date = (text: string): IsoDate => isoDateSchema.parse(text);
// 2027-05-10 is a Monday.
const DATES = ['2027-05-10', '2027-05-11', '2027-05-12'].map(date);
const HOME = { lat: 38.71, lng: -9.14 };
const BALANCED = 360;
/** Closed on Mondays, 10:00–18:00 otherwise. */
const tuesdayToSunday = [2, 3, 4, 5, 6, 7].map((day) => ({
  day,
  opens: isoTimeSchema.parse('10:00'),
  closes: isoTimeSchema.parse('18:00'),
}));

const spot = (
  id: string,
  lat: number,
  lng: number,
  overrides: Partial<PlanSpot> = {},
): PlanSpot => ({
  id,
  name: `Spot ${id}`,
  lat,
  lng,
  visitMinutes: 60,
  popularity: 50,
  openingHours: null,
  ...overrides,
});

const plainDays = (count: number, budget = BALANCED): DayFrame[] =>
  dayFrames({
    dates: DATES.slice(0, count),
    paceMinutes: budget,
    stay: null,
    arrival: null,
    departure: null,
  });

describe('dayFrames', () => {
  const trip: TravelFrame = {
    dates: DATES,
    paceMinutes: BALANCED,
    stay: { name: 'Casa', place: HOME },
    arrival: {
      date: DATES[0] ?? date('2027-05-10'),
      at: at(11, 25),
      airport: 'Lisbon (LIS)',
    },
    departure: {
      date: DATES[2] ?? date('2027-05-12'),
      at: at(17, 30),
      airport: 'Lisbon (LIS)',
      flightMinutes: 305,
    },
  };

  it('starts the first day after landing and checking in, and ends the last before the airport', () => {
    const [first, middle, last] = dayFrames(trip);

    expect(first?.before.map((m) => m.kind)).toEqual(['arrival', 'check-in']);
    expect(first?.start).toBe(at(11, 25) + 45 + 60 + 30);
    expect(middle).toMatchObject({
      start: at(9, 30),
      end: at(21),
      budget: BALANCED,
    });
    expect(last?.after.map((m) => m.kind)).toEqual(['to-airport', 'departure']);
    expect(last?.end).toBe(at(14, 30));
  });

  it('leaves no room on a day spent flying', () => {
    const [first] = dayFrames({
      ...trip,
      arrival: {
        date: DATES[1] ?? date('2027-05-11'),
        at: at(5, 35),
        airport: 'JFK',
      },
    });

    expect(first?.budget).toBe(0);
  });
});

describe('scheduleDay', () => {
  const [monday] = plainDays(1);

  it('breaks for lunch around midday and travels between spots', () => {
    const route = [
      spot('a', 38.711, -9.141, { visitMinutes: 120 }),
      spot('b', 38.712, -9.142, { visitMinutes: 120 }),
    ];
    const schedule =
      monday === undefined
        ? undefined
        : scheduleDay(monday, HOME, route, { strict: true });

    expect(schedule?.visits[0]?.start).toBe(
      at(9, 30) + (schedule?.visits[0]?.travel.minutes ?? 0),
    );
    const lunch = schedule?.lunchAt ?? 0;

    expect(lunch).toBeGreaterThanOrEqual(at(12));
    expect(lunch).toBeLessThan(at(14, 30));
    // Never during a visit.
    expect(
      schedule?.visits.some(
        (v) => lunch > v.start && lunch < v.start + v.spot.visitMinutes,
      ),
    ).toBe(false);
  });

  it('waits for opening, and refuses a spot closed that day', () => {
    const museum = spot('m', 38.711, -9.141, {
      openingHours: {
        text: 'Tu-Su 10:00-18:00',
        weekly: tuesdayToSunday,
      },
    });

    expect(visitStart(museum, 2, at(9, 40))).toBe(at(10));
    expect(visitStart(museum, 1, at(9, 40))).toBeUndefined();
    expect(
      monday === undefined
        ? 'no day'
        : scheduleDay(monday, HOME, [museum], { strict: true }),
    ).toBeUndefined();
  });

  it('refuses a day over its budget', () => {
    const long = [1, 2, 3, 4].map((n) =>
      spot(`l${String(n)}`, 38.711, -9.141, { visitMinutes: 120 }),
    );

    expect(
      monday === undefined
        ? 'no day'
        : scheduleDay(monday, HOME, long, { strict: true }),
    ).toBeUndefined();
  });
});

describe('assignSpots', () => {
  // Two neighbourhoods ~5 km apart, three spots each.
  const west = [1, 2, 3].map((n) =>
    spot(`w${String(n)}`, 38.697 + n * 0.001, -9.206),
  );
  const east = [1, 2, 3].map((n) =>
    spot(`e${String(n)}`, 38.713 + n * 0.001, -9.13),
  );

  it('keeps each neighbourhood on one day', () => {
    const { routes, dropped } = assignSpots(plainDays(2), HOME, [
      ...east,
      ...west,
    ]);
    const sides = routes.map((route) =>
      [...new Set(route.map((s) => s.id[0]))].join(''),
    );

    expect(dropped).toEqual([]);
    expect([...sides].sort()).toEqual(['e', 'w']);
  });

  it('drops the least popular spots when the days are full', () => {
    const many = [1, 2, 3, 4, 5, 6].map((n) =>
      spot(`p${String(n)}`, 38.711, -9.141, {
        visitMinutes: 120,
        popularity: n * 10,
      }),
    );
    const { routes, dropped } = assignSpots(plainDays(1), HOME, many);

    // Two 2-hour visits and the walk there fill a 6-hour day.
    expect(routes[0]?.map((s) => s.id).sort()).toEqual(['p5', 'p6']);
    expect(dropped.map((s) => s.id)).toEqual(['p4', 'p3', 'p2', 'p1']);
  });

  it('puts a spot closed on Monday on another day', () => {
    const museum = spot('museum', 38.711, -9.141, {
      popularity: 90,
      openingHours: {
        text: 'Tu-Su 10:00-18:00',
        weekly: tuesdayToSunday,
      },
    });
    const { routes } = assignSpots(plainDays(2), HOME, [museum]);

    expect(routes[0]).toEqual([]);
    expect(routes[1]?.map((s) => s.id)).toEqual(['museum']);
  });

  it('plans a big trip quickly', () => {
    const forty = Array.from({ length: 40 }, (_, n) =>
      spot(
        `s${String(n)}`,
        38.69 + (n % 8) * 0.006,
        -9.2 + Math.floor(n / 8) * 0.02,
        {
          popularity: (n * 37) % 100,
          visitMinutes: 45 + (n % 3) * 30,
        },
      ),
    );
    const started = Date.now();

    assignSpots(plainDays(3, 480), HOME, forty);

    expect(Date.now() - started).toBeLessThan(5000);
  });
});

describe('buildPlan / arrangePlan', () => {
  it('lays out the fixed moments, the visits and lunch as numbered stops with a title', () => {
    const frames = dayFrames({
      dates: DATES.slice(0, 1),
      paceMinutes: BALANCED,
      stay: { name: 'Casa', place: HOME },
      arrival: {
        date: DATES[0] ?? date('2027-05-10'),
        at: at(8),
        airport: 'Lisbon (LIS)',
      },
      departure: null,
    });
    const { days, droppedIds } = buildPlan(frames, HOME, [
      spot('top', 38.711, -9.141, { popularity: 90, name: 'Belém Tower' }),
      spot('b', 38.712, -9.142),
    ]);
    const stops = days[0]?.stops ?? [];

    expect(droppedIds).toEqual([]);
    expect(days[0]?.title).toBe('Around Belém Tower');
    expect(stops.map((s) => s.kind).slice(0, 2)).toEqual([
      'arrival',
      'check-in',
    ]);
    expect(stops.map((s) => s.position)).toEqual(stops.map((_, i) => i));
    expect(stops.filter((s) => s.kind === 'spot')).toHaveLength(2);
    expect(stops.find((s) => s.kind === 'spot')?.travelMode).toBe('walk');
    // In time order.
    expect(stops.map((s) => minutesOf(s.startsAt))).toEqual(
      [...stops.map((s) => minutesOf(s.startsAt))].sort((a, b) => a - b),
    );
  });

  it("keeps a traveler's own grouping, even past the budget", () => {
    const frames = plainDays(1);
    const heavy = [1, 2, 3, 4].map((n) =>
      spot(`h${String(n)}`, 38.711, -9.141, { visitMinutes: 120 }),
    );
    const days = arrangePlan(
      frames,
      HOME,
      new Map([[DATES[0] ?? '', { spots: heavy, lunchAfter: undefined }]]),
      new Map(),
    );

    expect(days[0]?.stops.filter((s) => s.kind === 'spot')).toHaveLength(4);
  });

  it("keeps the traveler's order, even when another is shorter", () => {
    const frames = plainDays(1);
    const near = spot('near', 38.712, -9.141);
    const mid = spot('mid', 38.73, -9.141);
    const far = spot('far', 38.76, -9.141);
    const day = DATES[0] ?? '';
    const days = arrangePlan(
      frames,
      HOME,
      new Map([[day, { spots: [far, near, mid], lunchAfter: undefined }]]),
      new Map([[day, new Set(['far', 'near', 'mid'])]]),
    );

    expect(
      days[0]?.stops.flatMap((s) => (s.kind === 'spot' ? [s.spotId] : [])),
    ).toEqual(['far', 'near', 'mid']);
  });

  it('puts a spot new to the day where it adds the least travel', () => {
    const frames = plainDays(1);
    const near = spot('near', 38.712, -9.141);
    const mid = spot('mid', 38.73, -9.141);
    const far = spot('far', 38.76, -9.141);
    const day = DATES[0] ?? '';
    const days = arrangePlan(
      frames,
      HOME,
      new Map([[day, { spots: [near, far, mid], lunchAfter: undefined }]]),
      new Map([[day, new Set(['near', 'far'])]]),
    );

    expect(
      days[0]?.stops.flatMap((s) => (s.kind === 'spot' ? [s.spotId] : [])),
    ).toEqual(['near', 'mid', 'far']);
  });

  it('keeps lunch where the traveler put it', () => {
    const frames = plainDays(1);
    const day = DATES[0] ?? '';
    const [a, b, c] = ['a', 'b', 'c'].map((id, n) =>
      spot(id, 38.712 + n * 0.001, -9.141),
    );
    const kinds = (lunchAfter: number) =>
      arrangePlan(
        frames,
        HOME,
        new Map([
          [
            day,
            {
              spots: [a, b, c].flatMap((s) => (s === undefined ? [] : [s])),
              lunchAfter,
            },
          ],
        ]),
        new Map([[day, new Set(['a', 'b', 'c'])]]),
      )[0]?.stops.map((s) => s.spotId ?? s.kind);

    expect(kinds(1)).toEqual(['a', 'lunch', 'b', 'c']);
    expect(kinds(3)).toEqual(['a', 'b', 'c', 'lunch']);
  });

  it('never starts a lunch the traveler moved earlier before noon', () => {
    const frames = plainDays(1);
    const day = DATES[0] ?? '';
    const stops =
      arrangePlan(
        frames,
        HOME,
        new Map([[day, { spots: [spot('a', 38.712, -9.141)], lunchAfter: 0 }]]),
        new Map([[day, new Set(['a'])]]),
      )[0]?.stops ?? [];

    expect(stops.map((s) => s.kind)).toEqual(['lunch', 'spot']);
    expect(stops[0]?.startsAt.slice(0, 5)).toBe('12:00');
  });
});
