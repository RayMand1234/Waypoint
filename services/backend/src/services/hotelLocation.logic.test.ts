import { describe, expect, it } from 'vitest';
import { travelMinutes } from '../lib/travel.ts';
import {
  geometricMedian,
  locationFactor,
  type Points,
  searchArea,
  stopsMinutes,
} from './hotelLocation.logic.ts';

// Spots in central Lisbon, and one far out (Belém, ~6 km west).
const BAIXA = { lat: 38.7107, lng: -9.1365 };
const CHIADO = { lat: 38.7108, lng: -9.1422 };
const ALFAMA = { lat: 38.7139, lng: -9.1334 };
const BELEM = { lat: 38.6916, lng: -9.216 };

describe('travelMinutes', () => {
  it('walks short hops and takes transit for long ones', () => {
    expect(travelMinutes(BAIXA, BAIXA)).toBe(0);
    // ~500 m straight: a walk of about 9 minutes.
    expect(travelMinutes(BAIXA, CHIADO)).toBeGreaterThan(5);
    expect(travelMinutes(BAIXA, CHIADO)).toBeLessThan(12);
    // ~7 km: walking would take well over an hour.
    expect(travelMinutes(BAIXA, BELEM)).toBeLessThan(45);
  });
});

describe('geometricMedian', () => {
  it('stays among the central spots where the mean drifts toward the far one', () => {
    const points: Points = [BAIXA, CHIADO, ALFAMA, BELEM];
    const middle = geometricMedian(points);
    const meanLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;

    expect(Math.abs(middle.lng - BAIXA.lng)).toBeLessThan(
      Math.abs(meanLng - BAIXA.lng),
    );
    expect(travelMinutes(middle, BAIXA)).toBeLessThan(10);
  });

  it('is the point itself for one point', () => {
    expect(geometricMedian([BELEM])).toEqual(BELEM);
  });
});

describe('searchArea', () => {
  it('covers most spots, at least 1 km and at most 5 km', () => {
    expect(searchArea([BAIXA, CHIADO]).radiusMeters).toBe(1000);
    // Sintra, ~20 km out: the midpoint is still ~10 km from each.
    expect(
      searchArea([BAIXA, { lat: 38.7975, lng: -9.3906 }]).radiusMeters,
    ).toBe(5000);
  });
});

describe('stopsMinutes', () => {
  it('takes the median, so one far spot does not count against a central hotel', () => {
    const central = stopsMinutes(BAIXA, [CHIADO, ALFAMA, BAIXA, BELEM, CHIADO]);

    expect(central).toBeLessThan(10);
  });
});

describe('locationFactor', () => {
  it('rewards nearer than typical and caps the effect both ways', () => {
    expect(locationFactor(10, 10)).toBe(1);
    expect(locationFactor(8, 10)).toBeCloseTo(1.25);
    expect(locationFactor(2, 10)).toBe(1.3);
    expect(locationFactor(60, 10)).toBe(0.7);
  });
});
