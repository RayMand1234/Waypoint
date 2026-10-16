import { isoDateSchema } from '@waypoint/contracts/common';
import { spotSchema, type Spot } from '@waypoint/contracts/destinations';
import { addDays, todayOf } from '@/shared/utils/dates';
import { dayState, monthGrid, pickDay, shiftMonth } from './calendar';
import { fitLabel, suggestedSpotIds } from './spotFit';
import { formatMinutes, spotMeta, toggleId, topPickIds } from './spotRowModel';

const date = (text: string) => isoDateSchema.parse(text);

const spot = (id: string, visitMinutes: number, popularity = 50): Spot =>
  spotSchema.parse({
    id: `00000000-0000-4000-8000-00000000000${id}`,
    destinationId: 'lisbon',
    name: `Spot ${id}`,
    category: 'museum',
    styles: ['culture', 'views'],
    lat: 38.7,
    lng: -9.1,
    address: null,
    description: null,
    website: null,
    visitMinutes,
    popularity,
    photo: null,
    openingHours: null,
    fee: { kind: 'unknown' },
    hasRating: false,
    checkedAt: '2027-04-01T10:00:00.000Z',
  });

describe('calendar', () => {
  it('adds days across months and years', () => {
    expect(addDays(date('2027-12-30'), 3)).toBe('2028-01-02');
  });

  it('lays a month out Monday first, padded with nulls', () => {
    const may2027 = monthGrid({ year: 2027, month: 4 });

    expect(may2027[0]?.slice(0, 6)).toEqual([
      null,
      null,
      null,
      null,
      null,
      '2027-05-01',
    ]);
    expect(may2027.every((week) => week.length === 7)).toBe(true);
  });

  it('wraps months across years', () => {
    expect(shiftMonth({ year: 2027, month: 11 }, 1)).toEqual({
      year: 2028,
      month: 0,
    });
    expect(shiftMonth({ year: 2027, month: 0 }, -1)).toEqual({
      year: 2026,
      month: 11,
    });
  });

  it('picks a start, then an end, and starts over otherwise', () => {
    const started = pickDay(
      { kind: 'range', start: date('2027-05-01'), end: date('2027-05-03') },
      date('2027-05-12'),
    );
    const ranged = pickDay(started, date('2027-05-16'));

    expect(started).toEqual({ kind: 'start', start: '2027-05-12' });
    expect(ranged).toEqual({
      kind: 'range',
      start: '2027-05-12',
      end: '2027-05-16',
    });
    expect(pickDay(started, date('2027-05-10'))).toEqual({
      kind: 'start',
      start: '2027-05-10',
    });
  });

  it('marks past days, the ends and the inside of a range', () => {
    const range = {
      kind: 'range',
      start: date('2027-05-12'),
      end: date('2027-05-16'),
    } as const;
    const today = date('2027-05-11');

    expect(dayState(date('2027-05-10'), range, today)).toBe('past');
    expect(dayState(date('2027-05-12'), range, today)).toBe('edge');
    expect(dayState(date('2027-05-14'), range, today)).toBe('inside');
    expect(dayState(date('2027-05-16'), range, today)).toBe('edge');
    expect(dayState(date('2027-05-20'), range, today)).toBe('none');
  });

  it("reads today from the traveler's local calendar", () => {
    expect(todayOf(new Date(2027, 4, 12, 23, 30))).toBe('2027-05-12');
  });
});

describe('spot fit', () => {
  it('says whether the picks fit the days at the pace', () => {
    expect(fitLabel([spot('1', 120), spot('2', 120)], 1, 'balanced')).toBe(
      'Fits in 1 day',
    );
    expect(fitLabel([spot('1', 300), spot('2', 300)], 1, 'balanced')).toBe(
      'Too many for 1 day',
    );
  });

  it('suggests the best-ranked spots that fit, skipping ones that would overflow', () => {
    const ids = suggestedSpotIds(
      [spot('1', 200), spot('2', 200), spot('3', 60)],
      1,
      'balanced',
    );

    expect(ids).toEqual([
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000003',
    ]);
  });
});

describe('spot rows', () => {
  it('words duration and meta', () => {
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(120)).toBe('2h');
    expect(formatMinutes(90)).toBe('1h 30m');
    expect(spotMeta(spot('1', 90))).toBe('Culture · Views · 1h 30m');
  });

  it('badges the three most popular as top picks', () => {
    const picks = topPickIds([
      spot('1', 60, 10),
      spot('2', 60, 90),
      spot('3', 60, 80),
      spot('4', 60, 70),
    ]);

    expect([...picks].sort()).toEqual(
      ['2', '3', '4'].map((n) => `00000000-0000-4000-8000-00000000000${n}`),
    );
  });

  it('toggles a picked id', () => {
    expect(toggleId(['a', 'b'], 'a')).toEqual(['b']);
    expect(toggleId(['b'], 'a')).toEqual(['b', 'a']);
  });
});
