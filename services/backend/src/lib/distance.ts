const EARTH_RADIUS_M = 6_371_000;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export type LatLng = { readonly lat: number; readonly lng: number };

/** Great-circle distance in whole metres (haversine). */
export const distanceMeters = (a: LatLng, b: LatLng): number => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(dLng / 2) ** 2;

  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h)));
};
