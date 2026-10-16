import { describe, expect, it } from 'vitest';
import { categoryOf } from './classify.ts';
import { parseFee } from './fee.ts';
import { parseOpeningHours } from './openingHours.ts';
import { popularityScores } from './popularity.ts';

describe('categoryOf', () => {
  it('takes the most specific category a place has', () => {
    expect(categoryOf(['Q16560', 'Q33506'])).toBe('museum');
    expect(categoryOf(['Q12518'])).toBe('landmark');
    expect(categoryOf(['Q999'])).toBeUndefined();
  });

  it('leaves out a place of an excluded class, whatever else it is', () => {
    // Paris: a city that Wikidata also files under a neighbourhood class.
    expect(categoryOf(['Q123705', 'Q515'])).toBeUndefined();
  });
});

describe('parseOpeningHours', () => {
  it('reads simple weekly hours, with a later rule replacing earlier days', () => {
    const hours = parseOpeningHours('Mo-Su 10:00-18:00; Mo off');

    expect(hours?.weekly?.map((p) => p.day)).toEqual([2, 3, 4, 5, 6, 7]);
    expect(hours?.weekly?.[0]).toEqual({
      day: 2,
      opens: '10:00',
      closes: '18:00',
    });
  });

  it('reads split days, wrap-around ranges and lunch breaks', () => {
    expect(
      parseOpeningHours('We-Mo 10:00-18:00')?.weekly?.map((p) => p.day),
    ).toEqual([1, 3, 4, 5, 6, 7]);
    expect(
      parseOpeningHours('Tu-Su 10:00-13:00,14:00-18:00')?.weekly,
    ).toHaveLength(12);
  });

  it('reads 24/7 and hours with no days as every day', () => {
    expect(parseOpeningHours('24/7')?.weekly).toHaveLength(7);
    expect(parseOpeningHours('09:00-21:00')?.weekly).toHaveLength(7);
  });

  it('keeps only the text for seasonal or holiday rules — never a wrong schedule', () => {
    expect(
      parseOpeningHours(
        'Oct-Apr: Tu-Su 10:00-17:30; May-Sep: Tu-Su 10:00-18:30',
      ),
    ).toEqual({
      text: 'Oct-Apr: Tu-Su 10:00-17:30; May-Sep: Tu-Su 10:00-18:30',
      weekly: null,
    });
    expect(parseOpeningHours('Mo-Fr 09:00-17:00; PH off')?.weekly).toBeNull();
  });

  it('is null when there is nothing', () => {
    expect(parseOpeningHours(undefined)).toBeNull();
    expect(parseOpeningHours('  ')).toBeNull();
  });
});

describe('parseFee', () => {
  it('is free only when OpenStreetMap says so', () => {
    expect(parseFee('no', undefined)).toEqual({ kind: 'free' });
    expect(parseFee(undefined, undefined)).toEqual({ kind: 'unknown' });
  });

  it('reads common charge formats', () => {
    expect(parseFee('yes', '15 EUR')).toEqual({
      kind: 'paid',
      price: { amountMinor: 1500, currency: 'EUR' },
    });
    expect(parseFee('yes', '€12.50')).toEqual({
      kind: 'paid',
      price: { amountMinor: 1250, currency: 'EUR' },
    });
    expect(parseFee(undefined, '8€')).toEqual({
      kind: 'paid',
      price: { amountMinor: 800, currency: 'EUR' },
    });
  });

  it('keeps "paid" without a price when the charge is unreadable', () => {
    expect(parseFee('yes', '5-10 EUR')).toEqual({ kind: 'paid', price: null });
    expect(parseFee('yes', undefined)).toEqual({ kind: 'paid', price: null });
  });
});

describe('popularityScores', () => {
  it('gives the top spot 100 and scales the rest on a log scale', () => {
    const [top, middle, none] = popularityScores([
      { views: 12_000, sitelinks: 57 },
      { views: 1_200, sitelinks: 20 },
      { views: 0, sitelinks: 0 },
    ]);

    expect(top).toBe(100);
    expect(middle).toBeGreaterThan(50);
    expect(middle).toBeLessThan(100);
    expect(none).toBe(0);
  });

  it('scores a place whose page views failed by its sitelinks, not as unread', () => {
    const [, unknown] = popularityScores([
      { views: 12_000, sitelinks: 57 },
      { views: null, sitelinks: 57 },
    ]);

    expect(unknown).toBe(100);
  });
});
