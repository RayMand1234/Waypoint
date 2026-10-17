import type {
  HotelReview,
  HotelReviews,
  HotelSummary,
} from '@waypoint/contracts/hotels';
import type { ProviderHotelReviews } from '../providers/types.ts';

/** How many reviews the details sheet shows from each end. */
export const REVIEWS_EACH = 3;

type SourceReview = ProviderHotelReviews['reviews'][number];

/** Written in English (the app's language) — `en`, `en-gb`, `en-us`… */
const isEnglish = (review: SourceReview): boolean =>
  review.language?.toLowerCase().startsWith('en') ?? false;

/** Has something to read, not just a score. */
const isWritten = (review: SourceReview): boolean =>
  review.headline !== null || review.liked !== null || review.disliked !== null;

/** Highest score first; the newer of two equal scores first. */
const highestFirst = (a: SourceReview, b: SourceReview): number =>
  b.score - a.score || b.date.localeCompare(a.date);

/** Lowest score first; the newer of two equal scores first. */
const lowestFirst = (a: SourceReview, b: SourceReview): number =>
  a.score - b.score || b.date.localeCompare(a.date);

const SCORE_DECIMALS = 10;

/** The reviews' average score, to one decimal; `null` without any. */
export const averageScore = (
  reviews: readonly Pick<HotelReview, 'score'>[],
): number | null =>
  reviews.length === 0
    ? null
    : Math.round(
        (reviews.reduce((sum, review) => sum + review.score, 0) /
          reviews.length) *
          SCORE_DECIMALS,
      ) / SCORE_DECIMALS;

/** A hotel the source has no score for, though guests have reviewed it. */
export const needsRating = (
  hotel: Pick<HotelSummary, 'rating' | 'reviewCount'>,
): boolean => hotel.rating === null && (hotel.reviewCount ?? 0) > 0;

const withoutLanguage = ({
  language: _language,
  ...review
}: SourceReview): HotelReview => review;

/**
 * What guests say, for the details sheet: the source's total and summary,
 * and a few written English reviews from each end — the best (highest
 * score, then newest) and the most critical (lowest score, then newest),
 * never the same review twice.
 */
export const toHotelReviews = (
  source: ProviderHotelReviews,
  count: number = REVIEWS_EACH,
): HotelReviews => {
  const readable = source.reviews.filter(
    (review) => isEnglish(review) && isWritten(review),
  );
  const best = readable.toSorted(highestFirst).slice(0, count);
  const critical = readable
    .filter((review) => !best.includes(review))
    .toSorted(lowestFirst)
    .slice(0, count);

  return {
    total: source.total,
    averageScore: averageScore(source.reviews),
    likes: [...source.likes],
    dislikes: [...source.dislikes],
    best: best.map(withoutLanguage),
    critical: critical.map(withoutLanguage),
  };
};
