import type {
  HotelReview,
  HotelReviews,
  TravelerType,
} from '@waypoint/contracts/hotels';
import { MONTH_NAMES } from '@/shared/utils/dates';

const MONTH_LETTERS = 3;
const thousands = new Intl.NumberFormat('en-GB');

const TRAVELER_NAMES: Readonly<Record<TravelerType, string | null>> = {
  solo: 'Solo',
  couple: 'Couple',
  family: 'Family',
  group: 'Group',
  business: 'Business',
  other: null,
};

/** "10", "8.5" — out of 10. */
export const scoreText = (score: number): string =>
  Number.isInteger(score) ? String(score) : score.toFixed(1);

/** "Charles · Couple · Oct 2026" — who, how they travelled, when. */
export const reviewByline = (
  review: Pick<HotelReview, 'name' | 'travelerType' | 'date'>,
): string =>
  [
    review.name,
    TRAVELER_NAMES[review.travelerType],
    `${(MONTH_NAMES[Number(review.date.slice(5, 7)) - 1] ?? '').slice(0, MONTH_LETTERS)} ${review.date.slice(0, 4)}`,
  ]
    .filter((part) => part !== null && part !== '')
    .join(' · ');

/** "4,557 reviews". */
export const reviewCount = (total: number): string =>
  `${thousands.format(total)} ${total === 1 ? 'review' : 'reviews'}`;

/** Whether there's anything worth a section: a review to read or a summary. */
export const hasSomethingToSay = (reviews: HotelReviews): boolean =>
  reviews.best.length > 0 ||
  reviews.critical.length > 0 ||
  reviews.likes.length > 0 ||
  reviews.dislikes.length > 0;
