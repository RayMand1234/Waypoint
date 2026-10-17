import { isoDateSchema } from '@waypoint/contracts/common';
import { tripDaySchema, type TripDay } from '@waypoint/contracts/trips';
import { dropIndex, makeRoomShift } from './dragOrder';
import {
  groupingOf,
  moveItem,
  withDayOrder,
  withoutSpot,
  withSpotOn,
  withStopsOrdered,
} from './planEdits';
import { dayMeta, notPlanned, timelineItem } from './planModel';

const stop = (position: number, overrides: Record<string, unknown> = {}) => ({
  id: `00000000-0000-4000-8000-00000000000${String(position)}`,
  position,
  kind: 'spot',
  spotId: `spot-${String(position)}`,
  name: `Spot ${String(position)}`,
  lat: 38.7,
  lng: -9.1,
  startsAt: '09:30',
  minutes: 120,
  travelMinutesFromPrevious: 8,
  travelMode: 'walk',
  isFixed: false,
  ...overrides,
});

const day = (
  date: string,
  stops: readonly Record<string, unknown>[],
): TripDay =>
  tripDaySchema.parse({
    id: `00000000-0000-4000-9000-0000000000${date.slice(-2)}`,
    dayIndex: 0,
    date,
    title: 'Around Spot 1',
    stops,
  });

const days = [
  day('2027-05-12', [
    stop(0, {
      kind: 'arrival',
      spotId: null,
      name: 'Land at Lisbon (LIS)',
      lat: null,
      lng: null,
      travelMinutesFromPrevious: null,
      travelMode: null,
      minutes: 45,
    }),
    stop(1),
    stop(2, { travelMode: 'transit', travelMinutesFromPrevious: 25 }),
  ]),
  day('2027-05-13', [stop(3)]),
];

describe('timelineItem', () => {
  it('words a spot with its travel, and a fixed moment without', () => {
    const [arrival, first, second] = (days[0]?.stops ?? []).map((s) =>
      timelineItem(s, new Map()),
    );

    expect(arrival).toMatchObject({
      time: '09:30',
      meta: 'Flight · 45m',
      travel: null,
      isSpot: false,
    });
    expect(first).toMatchObject({
      meta: '2h',
      travel: '8m walk',
      isSpot: true,
    });
    expect(second?.travel).toBe('Transit · 25m');
  });
});

describe('dayMeta', () => {
  it('counts the spots and says how full the day is for the pace', () => {
    const [arrivalDay, quietDay] = days;

    expect(arrivalDay && dayMeta(arrivalDay, 'balanced')).toBe(
      '2 stops · balanced',
    );
    expect(quietDay && dayMeta(quietDay, 'packed')).toBe('1 stop · easy');
  });
});

describe('plan edits', () => {
  it('moves and removes spots in the grouping', () => {
    const grouping = groupingOf(days);

    expect(grouping).toEqual([
      { date: '2027-05-12', spotIds: ['spot-1', 'spot-2'] },
      { date: '2027-05-13', spotIds: ['spot-3'] },
    ]);
    expect(withSpotOn(grouping, 'spot-1', '2027-05-13')).toEqual([
      { date: '2027-05-12', spotIds: ['spot-2'] },
      { date: '2027-05-13', spotIds: ['spot-3', 'spot-1'] },
    ]);
    expect(withoutSpot(grouping, 'spot-3')[1]?.spotIds).toEqual([]);
  });

  it('finds the trip spots outside the plan', () => {
    expect(
      notPlanned({
        days,
        spots: [
          { spotId: 'spot-1', name: 'Spot 1' },
          { spotId: 'spot-9', name: 'Spot 9' },
        ],
      }),
    ).toEqual([{ spotId: 'spot-9', name: 'Spot 9' }]);
  });
});

describe('reordering a day', () => {
  it('moves one item to a new index', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
  });

  it("sets one day's order, lunch's place too, and leaves the others", () => {
    const date = isoDateSchema.parse('2027-05-12');

    expect(
      withDayOrder(groupingOf(days), date, ['spot-2', 'lunch', 'spot-1']),
    ).toEqual([
      { date: '2027-05-12', spotIds: ['spot-2', 'spot-1'], lunchAfter: 1 },
      { date: '2027-05-13', spotIds: ['spot-3'] },
    ]);
  });

  it('keeps lunch after the same spots when one before it leaves', () => {
    const grouping = withDayOrder(
      groupingOf(days),
      isoDateSchema.parse('2027-05-12'),
      ['spot-1', 'spot-2', 'lunch'],
    );

    expect(withoutSpot(grouping, 'spot-1')[0]).toEqual({
      date: '2027-05-12',
      spotIds: ['spot-2'],
      lunchAfter: 1,
    });
  });

  it('swaps spots into each other’s slots, fixed moments staying put', () => {
    const first = days[0];

    if (first === undefined) throw new Error('no day');

    expect(
      withStopsOrdered(first, ['spot-2', 'spot-1']).stops.map((s) => s.name),
    ).toEqual(['Land at Lisbon (LIS)', 'Spot 2', 'Spot 1']);
  });

  it('lands a dragged row past every row whose centre it passes', () => {
    const centers = [50, 150, 250, 350];

    expect(dropIndex(centers, 0, 0)).toBe(0);
    expect(dropIndex(centers, 0, 160)).toBe(1);
    expect(dropIndex(centers, 0, 320)).toBe(3);
    expect(dropIndex(centers, 3, -320)).toBe(0);
  });

  it('slides the cards in between one slot to make room', () => {
    const bottoms = [100, 210, 320, 430];
    const shifts = (from: number, to: number) =>
      bottoms.map((_, index) => makeRoomShift(bottoms, from, to, index));

    // The first card hovers over the third: the second and third move up.
    expect(shifts(0, 2)).toEqual([0, -110, -110, 0]);
    // The last hovers over the second: the second and third move down.
    expect(shifts(3, 1)).toEqual([0, 110, 110, 0]);
    expect(shifts(-1, -1)).toEqual([0, 0, 0, 0]);
  });
});
