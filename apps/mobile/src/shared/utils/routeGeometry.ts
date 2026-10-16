// The Route's road (docs/design/system/components/Route): congruent S-curves
// between seven checkpoints, so checkpoint k sits at exactly k/6 of the path.
// At the design's 358pt width the checkpoints are 55pt apart at x = 12 … 342,
// alternating y = 28 / 42 inside a 68pt box. Widths scale the x spacing only.

import { cubic, sampledLength, type Point } from './bezier';

export type { Point } from './bezier';

/** The six steps, then Book. */
export const CHECKPOINT_COUNT = 7;
const GAPS = CHECKPOINT_COUNT - 1;

/** The road starts 12pt in and ends 16pt in (room for the larger finish checkpoint). */
const INSET_LEFT = 12;
const INSET_RIGHT = 16;
const HIGH_Y = 28;
const LOW_Y = 42;

/** Where pick labels sit (below the road) and how far above a checkpoint the step name sits. */
export const LABEL_TOP = 52;
export const NOW_LABEL_RISE = 26;
/** The first label hugs the left edge instead of centring on its checkpoint. */
export const FIRST_LABEL_LEFT = -4;

export const checkpoints = (width: number): readonly Point[] => {
  const spacing = (width - INSET_LEFT - INSET_RIGHT) / GAPS;

  return Array.from({ length: CHECKPOINT_COUNT }, (_, k) => ({
    x: INSET_LEFT + k * spacing,
    y: k % 2 === 0 ? HIGH_Y : LOW_Y,
  }));
};

/** SVG `d` for the whole road: one cubic S-curve per gap. */
export const roadPath = (points: readonly Point[]): string =>
  points.reduce((d, point, k) => {
    const previous = points[k - 1];

    if (previous === undefined) return `M${String(point.x)} ${String(point.y)}`;

    const half = (point.x - previous.x) / 2;

    return `${d} C${String(previous.x + half)} ${String(previous.y)} ${String(point.x - half)} ${String(point.y)} ${String(point.x)} ${String(point.y)}`;
  }, '');

/** Fraction of the road (0–1) at which checkpoint `index` (0–6) sits. */
export const fractionAt = (index: number): number =>
  Math.min(Math.max(index, 0), GAPS) / GAPS;

/**
 * The point `fraction` (0–1) of the way along the road. A worklet, so the
 * marker can follow the road on the UI thread.
 */
export const pointAt = (points: readonly Point[], fraction: number): Point => {
  'worklet';
  const clamped = Math.min(Math.max(fraction, 0), 1);
  const segment = Math.min(Math.floor(clamped * GAPS), GAPS - 1);
  const t = clamped * GAPS - segment;
  const from = points[segment] ?? { x: 0, y: 0 };
  const to = points[segment + 1] ?? from;
  const half = (to.x - from.x) / 2;

  return {
    x: cubic(from.x, from.x + half, to.x - half, to.x, t),
    y: cubic(from.y, from.y, to.y, to.y, t),
  };
};

/** Length of the road in points, by sampling — for the trail's dash animation. */
export const roadLength = (points: readonly Point[]): number =>
  sampledLength((fraction) => pointAt(points, fraction));
