import { describe, expect, it } from 'vitest';
import { clamp, median, percentile } from './stats.ts';

describe('stats', () => {
  it('takes the median of unsorted values, even and odd counts', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBe(0);
  });

  it('reads a percentile by nearest rank', () => {
    expect(percentile([10, 40, 20, 30, 50], 0.8)).toBe(40);
    expect(percentile([], 0.8)).toBe(0);
  });

  it('clamps into a range', () => {
    expect(clamp(1, 3, 5)).toBe(3);
    expect(clamp(1, 3, -2)).toBe(1);
    expect(clamp(1, 3, 2)).toBe(2);
  });
});
