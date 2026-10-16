import { describe, expect, it } from 'vitest';
import { rankByValue } from './value.ts';

const offer = (id: string, priceMinor: number, quality: number) => ({
  id,
  priceMinor,
  quality,
});
const rank = (items: ReturnType<typeof offer>[]) =>
  rankByValue(items, (item) => item, 'EUR');

describe('rankByValue', () => {
  it('puts the best quality for the money first, not the cheapest', () => {
    const ranked = rank([
      offer('cheap-poor', 8000, 0.4),
      offer('fair-great', 10000, 0.95),
      offer('pricey', 20000, 1),
    ]);

    expect(ranked.map(({ item }) => item.id)).toEqual([
      'fair-great',
      'cheap-poor',
      'pricey',
    ]);
  });

  it('marks exactly one offer as best value', () => {
    const ranked = rank([
      offer('a', 100, 0.5),
      offer('b', 100, 0.5),
      offer('c', 300, 0.9),
    ]);

    expect(ranked.filter(({ value }) => value.isBestValue)).toHaveLength(1);
    expect(ranked[0]?.item.id).toBe('a');
  });

  it('never reports negative savings', () => {
    const ranked = rank([offer('a', 100, 1), offer('b', 300, 1)]);
    const byId = new Map(
      ranked.map(({ item, value }) => [item.id, value.savingsVsAverage]),
    );

    expect(byId.get('a')).toEqual({ amountMinor: 100, currency: 'EUR' });
    expect(byId.get('b')).toEqual({ amountMinor: 0, currency: 'EUR' });
  });

  it('returns nothing for nothing', () => {
    expect(rank([])).toEqual([]);
  });
});
