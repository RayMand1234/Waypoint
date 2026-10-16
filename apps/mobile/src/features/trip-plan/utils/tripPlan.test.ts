import { tripDaySchema, type TripDay } from '@waypoint/contracts/trips';
import { groupingOf, withoutSpot, withSpotOn } from './planEdits';
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
