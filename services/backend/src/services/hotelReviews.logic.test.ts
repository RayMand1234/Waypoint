import { isoDateTimeSchema } from '@waypoint/contracts/common';
import { describe, expect, it } from 'vitest';
import type { ProviderHotelReviews } from '../providers/types.ts';
import { toHotelReviews } from './hotelReviews.logic.ts';

const review = (
  score: number,
  day: number,
  overrides: Partial<ProviderHotelReviews['reviews'][number]> = {},
): ProviderHotelReviews['reviews'][number] => ({
  score,
  name: `Guest ${String(day)}`,
  countryCode: null,
  travelerType: 'couple',
  date: isoDateTimeSchema.parse(
    `2027-05-${String(day).padStart(2, '0')}T00:00:00Z`,
  ),
  headline: null,
  liked: 'Great location',
  disliked: null,
  language: 'en-gb',
  ...overrides,
});

const source = (
  reviews: ProviderHotelReviews['reviews'],
): ProviderHotelReviews => ({
  total: 4557,
  likes: ['Great location'],
  dislikes: ['Small rooms'],
  reviews,
});

describe('toHotelReviews', () => {
  it('picks the best and the most critical written English reviews', () => {
    const picked = toHotelReviews(
      source([
        review(8, 1),
        review(10, 2),
        review(10, 5),
        review(9, 3),
        review(2, 4),
        review(4, 6),
        review(4, 7),
        review(7, 8),
      ]),
    );

    expect(picked.best.map((r) => r.name)).toEqual([
      'Guest 5',
      'Guest 2',
      'Guest 3',
    ]);
    expect(picked.critical.map((r) => r.name)).toEqual([
      'Guest 4',
      'Guest 7',
      'Guest 6',
    ]);
    expect(picked).toMatchObject({
      total: 4557,
      likes: ['Great location'],
      dislikes: ['Small rooms'],
    });
  });

  it('never shows a review in both lists when there are few', () => {
    const picked = toHotelReviews(source([review(9, 1), review(3, 2)]));

    expect(picked.best.map((r) => r.name)).toEqual(['Guest 1', 'Guest 2']);
    expect(picked.critical).toEqual([]);
  });

  it('skips reviews in other languages and ones with nothing written', () => {
    const picked = toHotelReviews(
      source([
        review(10, 1, { language: 'de' }),
        review(10, 2, { liked: null }),
        review(10, 3, { language: null }),
        review(6, 4, { language: 'en-us', liked: null, disliked: 'Noisy' }),
      ]),
    );

    expect(picked.best.map((r) => r.name)).toEqual(['Guest 4']);
    expect(picked.best[0]).not.toHaveProperty('language');
  });
});
