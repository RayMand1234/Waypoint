import { profileFormSchema } from './profileFormSchema';

describe('profile form', () => {
  it('turns blank fields into null (clear) and upper-cases the airport', () => {
    expect(
      profileFormSchema.parse({
        name: '  ',
        homeAirport: 'tlv',
        currency: 'ILS',
      }),
    ).toEqual({ name: null, homeAirport: 'TLV', currency: 'ILS' });
  });

  it('refuses an airport that is not a 3-letter code', () => {
    const result = profileFormSchema.safeParse({
      name: 'Ray',
      homeAirport: 'TL',
      currency: 'EUR',
    });

    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'Use the 3-letter airport code, like TLV.',
    );
  });
});
