import type { IsoDate } from '@waypoint/contracts/common';
import type { OpeningHours } from '@waypoint/contracts/destinations';
import type { StopKind } from '@waypoint/contracts/trips';
import type { LatLng } from '../../lib/distance.ts';

/** A spot as the planner sees it. */
export type PlanSpot = LatLng & {
  readonly id: string;
  readonly name: string;
  readonly visitMinutes: number;
  /** 0–100; the less popular are dropped first when the days are full. */
  readonly popularity: number;
  /** `null` (or no weekly schedule) reads as open all day. */
  readonly openingHours: OpeningHours | null;
};

/** A fixed moment around the spots: landing, checking in, the airport run, the flight home. */
export type Moment = {
  readonly kind: Exclude<StopKind, 'spot' | 'lunch'>;
  readonly name: string;
  /** Minutes after midnight. */
  readonly at: number;
  readonly minutes: number;
  readonly place: LatLng | null;
};

/** One day's room for spots, and the fixed moments before and after them. */
export type DayFrame = {
  readonly date: IsoDate;
  /** ISO: 1 = Monday … 7 = Sunday. */
  readonly weekday: number;
  /** When sightseeing can start and must end, in minutes after midnight. */
  readonly start: number;
  readonly end: number;
  /** Visiting plus travelling, at most — the trip's pace, or less on a short day. */
  readonly budget: number;
  readonly before: readonly Moment[];
  readonly after: readonly Moment[];
};
