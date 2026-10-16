import { flightSearchRequestSchema } from '@waypoint/contracts/flights';
import { describe, expect, it } from 'vitest';
import { fakeFetch, silentLogger } from '../../testing/index.ts';
import { rawFlightRatesResponse } from '../../testing/sampleTrip.ts';
import { createLiteApiClient } from './client.ts';
import { createLiteApiFlightProvider } from './flights.ts';

const NOW = new Date('2027-04-01T10:00:00.000Z');

const request = flightSearchRequestSchema.parse({
  origin: 'TLV',
  destination: 'LIS',
  departDate: '2027-05-12',
  returnDate: '2027-05-16',
  maxStops: 1,
});

const setup = () => {
  const fake = fakeFetch(() => ({ body: rawFlightRatesResponse }));
  const client = createLiteApiClient({
    apiKey: 'k',
    baseUrl: 'https://api.test/v3.0',
    timeoutMs: 1000,
    fetch: fake.fetch,
  });
  const provider = createLiteApiFlightProvider({
    client,
    logger: silentLogger(),
    whitelabelUrl: 'https://book.example',
    now: () => NOW,
  });

  return { ...fake, provider };
};

describe('liteAPI flight provider', () => {
  it('sends a round trip as two legs', async () => {
    const { provider, calls } = setup();

    await provider.searchFlights(request, AbortSignal.timeout(1000));

    expect(calls[0]?.body).toMatchObject({
      legs: [
        {
          origin: 'TLV',
          destination: 'LIS',
          date: '2027-05-12',
          direction: 'OUTBOUND',
        },
        {
          origin: 'LIS',
          destination: 'TLV',
          date: '2027-05-16',
          direction: 'INBOUND',
        },
      ],
      adults: 2,
      cabinClass: 'ECONOMY',
      currency: 'EUR',
      filters: { maxStops: 1 },
    });
  });

  it('groups segments into legs and drops malformed journeys on their own', async () => {
    const { provider } = setup();

    const result = await provider.searchFlights(
      request,
      AbortSignal.timeout(1000),
    );

    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const [direct, via] = result.value;

    expect(result.value).toHaveLength(2);
    expect(direct).toMatchObject({
      itineraryId: 'tlv-lis-direct',
      providerOfferId: 'fo-direct',
      price: { amountMinor: 64020, currency: 'EUR' },
      refundable: false,
      changeable: true,
      baggage: { carryOn: true, checked: false },
      seatsRemaining: 4,
      expiresAt: '2026-05-01T10:00:00Z',
      checkedAt: NOW.toISOString(),
    });
    expect(
      direct?.legs.map((leg) => [
        leg.direction,
        leg.stops,
        leg.durationMinutes,
      ]),
    ).toEqual([
      ['outbound', 0, 355],
      ['inbound', 0, 335],
    ]);
    // The offset liteAPI sometimes adds is dropped: times are airport-local.
    expect(direct?.legs[1]?.departAt).toBe('2027-05-16T21:30:00');
    expect(via?.legs).toHaveLength(1);
    expect(via?.legs[0]).toMatchObject({
      stops: 1,
      durationMinutes: 410,
      departAt: '2027-05-12T05:00:00',
    });
    expect(new URL(direct?.deepLink ?? '').searchParams.get('offerId')).toBe(
      'fo-direct',
    );
  });
});
