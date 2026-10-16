import { cubic, sampledLength, type Point } from '@/shared/utils/bezier';

// The route moment's road: the seven checkpoints winding down the screen,
// alternating at one and two thirds of the width (130 / 260 on the design's
// 390pt frame), joined by vertical S-curves so checkpoint k sits at k/6.

export const CHECKPOINTS = 7;
const GAPS = CHECKPOINTS - 1;

export type MomentLayout = {
  readonly width: number;
  /** Where the first checkpoint sits. */
  readonly top: number;
  /** Vertical distance between checkpoints. */
  readonly spacing: number;
};

export const momentPoints = ({ width, top, spacing }: MomentLayout): Point[] =>
  Array.from({ length: CHECKPOINTS }, (_, k) => ({
    x: (k % 2 === 0 ? 1 : 2) * (width / 3),
    y: top + k * spacing,
  }));

/** SVG `d` for the road. */
export const momentPath = (points: readonly Point[]): string =>
  points.reduce((d, point, k) => {
    const previous = points[k - 1];

    if (previous === undefined) return `M${String(point.x)} ${String(point.y)}`;

    const half = (point.y - previous.y) / 2;

    return `${d} C${String(previous.x)} ${String(previous.y + half)} ${String(point.x)} ${String(point.y - half)} ${String(point.x)} ${String(point.y)}`;
  }, '');

/** The point `fraction` (0–1) along the road. A worklet, for the marker. */
export const momentPointAt = (
  points: readonly Point[],
  fraction: number,
): Point => {
  'worklet';
  const clamped = Math.min(Math.max(fraction, 0), 1);
  const segment = Math.min(Math.floor(clamped * GAPS), GAPS - 1);
  const t = clamped * GAPS - segment;
  const from = points[segment] ?? { x: 0, y: 0 };
  const to = points[segment + 1] ?? from;
  const half = (to.y - from.y) / 2;

  return {
    x: cubic(from.x, from.x, to.x, to.x, t),
    y: cubic(from.y, from.y + half, to.y - half, to.y, t),
  };
};

export const momentLength = (points: readonly Point[]): number =>
  sampledLength((f) => momentPointAt(points, f));

/** Fraction of the road at checkpoint `index` (0–6). */
export const checkpointFraction = (index: number): number =>
  Math.min(Math.max(index, 0), GAPS) / GAPS;
