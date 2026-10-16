export type Point = { readonly x: number; readonly y: number };

/** One coordinate of a cubic Bézier at `t` (0–1). A worklet, so animations can call it on the UI thread. */
export const cubic = (
  a: number,
  b: number,
  c: number,
  d: number,
  t: number,
): number => {
  'worklet';
  const u = 1 - t;

  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

const SAMPLES = 120;

/** Length of a path given as "point at fraction", by sampling — for dash-offset trail animations. */
export const sampledLength = (pointAt: (fraction: number) => Point): number =>
  Array.from(
    { length: SAMPLES },
    (_, i) => [pointAt(i / SAMPLES), pointAt((i + 1) / SAMPLES)] as const,
  ).reduce((sum, [a, b]) => sum + Math.hypot(b.x - a.x, b.y - a.y), 0);
