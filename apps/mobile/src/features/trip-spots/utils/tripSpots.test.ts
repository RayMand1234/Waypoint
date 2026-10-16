import { isoDateSchema } from '@waypoint/contracts/common';
import { spotSchema, type Spot } from '@waypoint/contracts/destinations';
import { addDays, todayOf } from '@/shared/utils/dates';
import { dayState, monthGrid, pickDay, shiftMonth } from './calendar';
import { fitLabel, suggestedSpotIds } from './spotFit';
import { formatDuration } from '@/shared/utils/format';
import {
  feeText,
  formatHours,
  googleMapsUrl,
  photoCredit,
  spotFacts,
} from './spotDetails';
import {
  cardPhotoUrl,
  spotMeta,
  toggleId,
  topPickIds,
  topPicksFirst,
} from './spotRowModel';

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
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(90)).toBe('1h 30m');
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

  it('lists top picks first, each group keeping its order', () => {
    const spots = ['a', 'b', 'c', 'd'].map((id) => ({ id }));

    expect(
      topPicksFirst(spots, new Set(['d', 'b'])).map((spot) => spot.id),
    ).toEqual(['b', 'd', 'a', 'c']);
  });

  it('asks Wikimedia for a card-sized thumbnail, leaving other photos alone', () => {
    const base =
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/T.jpg';

    expect(cardPhotoUrl(`${base}/1280px-T.jpg?x=1`)).toBe(
      `${base}/500px-T.jpg?x=1`,
    );
    expect(cardPhotoUrl(`${base}/330px-T.jpg`)).toBe(`${base}/330px-T.jpg`);
    expect(cardPhotoUrl('https://example.com/a.jpg')).toBe(
      'https://example.com/a.jpg',
    );
  });

  it('toggles a picked id', () => {
    expect(toggleId(['a', 'b'], 'a')).toEqual(['b']);
    expect(toggleId(['b'], 'a')).toEqual(['b', 'a']);
  });
});

describe('spot details', () => {
  it('words OpenStreetMap hours one rule per line', () => {
    expect(
      formatHours('Oct-Apr: Tu-Su 10:00-17:30; May-Sep 10:00-18:30; Mo off'),
    ).toBe('Oct–Apr: Tue–Sun 10:00–17:30\nMay–Sep 10:00–18:30\nMon closed');
  });

  it('never shows an unknown fee', () => {
    expect(feeText({ kind: 'free' })).toBe('Free');
    expect(feeText({ kind: 'paid', price: null })).toBe('Paid entry');
    expect(feeText({ kind: 'unknown' })).toBeUndefined();
  });

  it('lists only the facts research found', () => {
    expect(spotFacts(spot('1', 90))).toEqual([
      ['Visit', 'About 1h 30m'],
      ['Good for', 'Culture, Views'],
    ]);
  });

  it('searches Google Maps by name in the city', () => {
    expect(googleMapsUrl('Belém Tower', 'Lisbon')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Bel%C3%A9m%20Tower%2C%20Lisbon',
    );
  });

  it('credits the photo, author when known', () => {
    expect(photoCredit({ author: 'Ann', license: 'CC BY 4.0' })).toBe(
      'Photo: Ann · CC BY 4.0',
    );
    expect(photoCredit({ author: null, license: 'CC0' })).toBe('Photo: CC0');
  });
});
