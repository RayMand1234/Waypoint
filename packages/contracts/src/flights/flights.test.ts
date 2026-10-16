import { describe, expect, it } from 'vitest';
import { flightSearchRequestSchema } from './routes.ts';

describe('flightSearchRequestSchema', () => {
  const base = { origin: 'TLV', destination: 'LIS', departDate: '2027-05-12' };

  it('is one way by default, for the sample party', () => {
    expect(flightSearchRequestSchema.parse(base)).toMatchObject({
      returnDate: null,
      adults: 2,
      cabinClass: 'economy',
      currency: 'EUR',
      maxStops: null,
    });
  });

  it('refuses a return before departure, or the same airport twice', () => {
    expect(
      flightSearchRequestSchema.safeParse({ ...base, returnDate: '2027-05-11' })
        .success,
    ).toBe(false);
    expect(
      flightSearchRequestSchema.safeParse({ ...base, destination: 'TLV' })
        .success,
    ).toBe(false);
  });

  it('refuses a lower-case or wrong-length IATA code', () => {
    expect(
      flightSearchRequestSchema.safeParse({ ...base, origin: 'tlv' }).success,
    ).toBe(false);
    expect(
      flightSearchRequestSchema.safeParse({ ...base, origin: 'TLVX' }).success,
    ).toBe(false);
  });
});
