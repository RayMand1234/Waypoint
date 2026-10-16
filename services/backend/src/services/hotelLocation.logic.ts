import type { LatLng } from '../lib/distance.ts';
import { distanceMeters } from '../lib/distance.ts';
import { clamp, median, percentile } from '../lib/stats.ts';
import { travelMinutes } from '../lib/travel.ts';

// Where a trip's hotel should be: among the spots the traveler picked. Pure.

/** Weiszfeld steps; it settles well before this for a city's spots. */
const MAX_STEPS = 100;
/** Stop when a step moves the point less than this, in degrees (~1 cm). */
const SETTLED_DEGREES = 1e-7;
/** Search wide enough to cover this share of the stops… */
const AREA_SHARE = 0.8;
/** …within these bounds, so a lone far spot doesn't send us to the suburbs. */
const MIN_RADIUS_M = 1000;
const MAX_RADIUS_M = 5000;
const RADIUS_STEP_M = 100;
/** How far location can lift or lower a hotel's quality. */
const MIN_LOCATION_FACTOR = 0.7;
const MAX_LOCATION_FACTOR = 1.3;

export type SearchArea = LatLng & { readonly radiusMeters: number };

/** At least one point — a middle of nothing has no answer. */
export type Points = readonly [LatLng, ...LatLng[]];

const mean = (points: Points): LatLng => ({
  lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
  lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length,
});

/**
 * The point with the least total distance to every point — the geometric
 * median, by Weiszfeld's algorithm: start at the mean, then repeatedly move to
 * the average of the points weighted by 1 / distance, so near points pull
 * harder and a far one barely moves it (unlike the mean). Longitudes are
 * scaled by cos(latitude) so a degree east counts as much as a degree north.
 */
export const geometricMedian = (points: Points): LatLng => {
  const start = mean(points);
  const scale = Math.cos((start.lat * Math.PI) / 180);
  const step = (current: LatLng): LatLng => {
    const weights = points.map((p) => {
      const d = Math.hypot(p.lat - current.lat, (p.lng - current.lng) * scale);

      // Sitting on a point: weigh it heavily instead of dividing by zero.
      return 1 / Math.max(d, SETTLED_DEGREES);
    });
    const total = weights.reduce((sum, w) => sum + w, 0);

    return {
      lat:
        points.reduce((sum, p, i) => sum + p.lat * (weights[i] ?? 0), 0) /
        total,
      lng:
        points.reduce((sum, p, i) => sum + p.lng * (weights[i] ?? 0), 0) /
        total,
    };
  };
  const settle = (current: LatLng, stepsLeft: number): LatLng => {
    const next = step(current);
    const moved = Math.hypot(next.lat - current.lat, next.lng - current.lng);

    return moved < SETTLED_DEGREES || stepsLeft <= 1
      ? next
      : settle(next, stepsLeft - 1);
  };

  return points.length === 1 ? start : settle(start, MAX_STEPS);
};

/** Where to search for hotels: the stops' middle, wide enough for most of them. */
export const searchArea = (stops: Points): SearchArea => {
  const center = geometricMedian(stops);
  const reach = percentile(
    stops.map((stop) => distanceMeters(center, stop)),
    AREA_SHARE,
  );

  return {
    ...center,
    radiusMeters: clamp(
      MIN_RADIUS_M,
      MAX_RADIUS_M,
      Math.ceil(reach / RADIUS_STEP_M) * RADIUS_STEP_M,
    ),
  };
};

/** Typical travel minutes from a hotel to the stops — the median, robust to one far spot. */
export const stopsMinutes = (hotel: LatLng, stops: readonly LatLng[]): number =>
  Math.round(median(stops.map((stop) => travelMinutes(hotel, stop))));

/**
 * How location adjusts a hotel's quality, against the other hotels found:
 * typical minutes ÷ its minutes, so a hotel half as far as most scores higher.
 * Clamped, so location can't outweigh everything else.
 */
export const locationFactor = (
  minutes: number,
  typicalMinutes: number,
): number =>
  clamp(
    MIN_LOCATION_FACTOR,
    MAX_LOCATION_FACTOR,
    Math.max(typicalMinutes, 1) / Math.max(minutes, 1),
  );

/** The typical minutes across all hotels, for `locationFactor`. */
export const typicalMinutes = (minutes: readonly number[]): number =>
  median(minutes);
