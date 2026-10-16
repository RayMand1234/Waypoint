import { distanceMeters, type LatLng } from './distance.ts';

// A travel-time estimate in a city, with no routing API: streets wind, so the
// straight line is stretched; short hops are walked, longer ones take transit
// (a wait, then a ride). Rough on purpose — the same estimate ranks hotels and
// plans days, so their numbers agree.

/** How much longer a street route is than the straight line. */
const DETOUR = 1.3;
const WALK_KMH = 4.5;
const TRANSIT_KMH = 20;
/** Walking to a stop and waiting for the next ride. */
const TRANSIT_WAIT_MINUTES = 10;

const minutesAt = (kmh: number, meters: number): number =>
  (meters / 1000 / kmh) * 60;

export type TravelLeg = {
  readonly minutes: number;
  readonly mode: 'walk' | 'transit';
};

/** How to get from `a` to `b`: walking, or transit when that's quicker (past ~1 km). */
export const travelLeg = (a: LatLng, b: LatLng): TravelLeg => {
  const meters = distanceMeters(a, b) * DETOUR;
  const walk = minutesAt(WALK_KMH, meters);
  const transit = TRANSIT_WAIT_MINUTES + minutesAt(TRANSIT_KMH, meters);

  return walk <= transit
    ? { minutes: Math.round(walk), mode: 'walk' }
    : { minutes: Math.round(transit), mode: 'transit' };
};

/** Estimated minutes from `a` to `b`. */
export const travelMinutes = (a: LatLng, b: LatLng): number =>
  travelLeg(a, b).minutes;
