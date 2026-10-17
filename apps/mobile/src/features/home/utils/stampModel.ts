import type { Photo } from '@waypoint/contracts/destinations';
import type { TripListItem } from '@waypoint/contracts/trips';
import { MONTH_NAMES } from '@/shared/utils/dates';

/** A past trip as a been-there stamp. */
export type StampModel = {
  readonly id: string;
  readonly city: string;
  /** "Jan 2026", from when the trip started; `null` without dates. */
  readonly when: string | null;
  readonly photo: Photo | null;
};

const MONTH_LETTERS = 3;

const monthYear = (isoDate: string): string =>
  `${(MONTH_NAMES[Number(isoDate.slice(5, 7)) - 1] ?? '').slice(0, MONTH_LETTERS)} ${isoDate.slice(0, 4)}`;

export const toStamp = (trip: TripListItem): StampModel => ({
  id: trip.id,
  city: trip.destinationName ?? 'A trip',
  when: trip.startDate === null ? null : monthYear(trip.startDate),
  photo: trip.destinationPhoto,
});
