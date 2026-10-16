import {
  checkpoints,
  fractionAt,
  pointAt,
  roadLength,
  roadPath,
} from './routeGeometry';

describe('route geometry', () => {
  const points = checkpoints(358);

  it('matches the design at 358pt: x = 12 … 342, 55pt apart, y alternating 28 / 42', () => {
    expect(points.map((p) => p.x)).toEqual([12, 67, 122, 177, 232, 287, 342]);
    expect(points.map((p) => p.y)).toEqual([28, 42, 28, 42, 28, 42, 28]);
  });

  it('builds the same path as the design', () => {
    expect(roadPath(points)).toBe(
      'M12 28 C39.5 28 39.5 42 67 42 C94.5 42 94.5 28 122 28 C149.5 28 149.5 42 177 42 C204.5 42 204.5 28 232 28 C259.5 28 259.5 42 287 42 C314.5 42 314.5 28 342 28',
    );
  });

  it('puts checkpoint k at exactly k/6 of the road', () => {
    points.forEach((point, k) => {
      const at = pointAt(points, fractionAt(k));

      expect(at.x).toBeCloseTo(point.x);
      expect(at.y).toBeCloseTo(point.y);
    });
  });

  it('clamps fractions outside 0–1', () => {
    expect(pointAt(points, -1)).toEqual(points[0]);
    expect(pointAt(points, 2).x).toBeCloseTo(342);
  });

  it('is a bit longer than the straight distance', () => {
    expect(roadLength(points)).toBeGreaterThan(330);
    expect(roadLength(points)).toBeLessThan(360);
  });
});
