// The status values the destinations and spots tables allow (their CHECK
// constraints), in one place so a typo can't compile.

export const DESTINATION_STATUS = {
  /** Curated, being reviewed. */
  draft: 'draft',
  /** Curated and offered. */
  published: 'published',
  /** Added from a traveler's search; offered, not suggested. */
  searched: 'searched',
} as const;
export type DestinationStatus =
  (typeof DESTINATION_STATUS)[keyof typeof DESTINATION_STATUS];

export const SPOT_STATUS = {
  draft: 'draft',
  review: 'review',
  published: 'published',
  rejected: 'rejected',
} as const;
export type SpotStatus = (typeof SPOT_STATUS)[keyof typeof SPOT_STATUS];
