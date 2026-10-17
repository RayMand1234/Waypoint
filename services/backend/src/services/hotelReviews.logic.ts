import type { HotelReviews } from '@waypoint/contracts/hotels';
import type { ProviderHotelReviews } from '../providers/types.ts';

/** How many reviews the details sheet shows. */
export const TOP_REVIEWS = 3;

type SourceReview = ProviderHotelReviews['reviews'][number];

/** Written in English (the app's language) — `en`, `en-gb`, `en-us`… */
const isEnglish = (review: SourceReview): boolean =>
  review.language?.toLowerCase().startsWith('en') ?? false;

/** Has something to read, not just a score. */
const isWritten = (review: SourceReview): boolean =>
  review.headline !== null || review.liked !== null || review.disliked !== null;

/** Highest score first; the newer of two equal scores first. */
const byScoreThenDate = (a: SourceReview, b: SourceReview): number =>
  b.score - a.score || b.date.localeCompare(a.date);

/**
 * What guests say, for the details sheet: the source's total and summary,
 * and its best few written English reviews (highest score, then newest).
 */
export const toHotelReviews = (
  source: ProviderHotelReviews,
  count: number = TOP_REVIEWS,
): HotelReviews => ({
  total: source.total,
  likes: [...source.likes],
  dislikes: [...source.dislikes],
  reviews: source.reviews
    .filter((review) => isEnglish(review) && isWritten(review))
    .toSorted(byScoreThenDate)
    .slice(0, count)
    .map(({ language: _language, ...review }) => review),
});
