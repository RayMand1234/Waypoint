import { describe, expect, it } from 'vitest';
import { cityParamsSchema, searchPlacesQuerySchema } from './routes.ts';

describe('geo routes', () => {
  it('normalises the country code in a path', () => {
    expect(
      cityParamsSchema.parse({ countryCode: 'pt', cityName: ' Lisbon ' }),
    ).toEqual({
      countryCode: 'PT',
      cityName: 'Lisbon',
    });
    expect(
      cityParamsSchema.safeParse({ countryCode: 'PRT', cityName: 'Lisbon' })
        .success,
    ).toBe(false);
  });

  it('needs at least two characters to search places', () => {
    expect(searchPlacesQuerySchema.safeParse({ q: 'L' }).success).toBe(false);
    expect(searchPlacesQuerySchema.parse({ q: 'Lis', extra: '1' })).toEqual({
      q: 'Lis',
    });
  });
});
