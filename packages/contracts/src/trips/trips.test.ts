import { describe, expect, it } from 'vitest';
import {
  createTripRequestSchema,
  putPlanRequestSchema,
  putSelectionRequestSchema,
  selectionParamsSchema,
  tripDetailSchema,
  updateTripRequestSchema,
} from './routes.ts';
import { profileSchema } from './profile.ts';
import { offerSnapshotSchemas } from './selection.ts';

const sampleStop = {
  position: 0,
  kind: 'spot',
  spotId: 'lisbon-alfama',
  name: 'Alfama',
  lat: 38.7118,
  lng: -9.1296,
  startsAt: '09:30',
  minutes: 90,
  travelMinutesFromPrevious: null,
  travelMode: null,
  isFixed: false,
};

describe('createTripRequest', () => {
  it('fills the sample trip defaults for an empty body', () => {
    expect(createTripRequestSchema.parse({})).toEqual({
      styles: [],
      pace: 'balanced',
      adults: 2,
      childrenAges: [],
      originAirport: null,
    });
  });

  it('rejects an unknown field rather than ignoring it', () => {
    expect(
      createTripRequestSchema.safeParse({ userId: 'spoofed' }).success,
    ).toBe(false);
  });

  it('rejects a trip with no adults', () => {
    expect(createTripRequestSchema.safeParse({ adults: 0 }).success).toBe(
      false,
    );
  });
});

describe('updateTripRequest', () => {
  it('takes one pick at a time, as each step saves', () => {
    expect(updateTripRequestSchema.parse({ destinationId: 'lisbon' })).toEqual({
      destinationId: 'lisbon',
    });
  });

  it('takes null to clear a pick', () => {
    expect(updateTripRequestSchema.parse({ startDate: null })).toEqual({
      startDate: null,
    });
  });

  it('rejects a user id in the body — the service trusts only the verified token', () => {
    expect(
      updateTripRequestSchema.safeParse({ userId: 'someone-else' }).success,
    ).toBe(false);
  });
});

describe('plan stops', () => {
  it('needs a spot stop to say which spot and where; fixed moments may have no place', () => {
    const day = (stop: Record<string, unknown>) =>
      putPlanRequestSchema.safeParse({
        days: [{ dayIndex: 0, date: '2026-05-12', title: null, stops: [stop] }],
      }).success;

    expect(day({ ...sampleStop, lat: null })).toBe(false);
    expect(
      day({ ...sampleStop, kind: 'lunch', spotId: null, lat: null, lng: null }),
    ).toBe(true);
  });
});

describe('putPlanRequest', () => {
  it('takes days of stops with no server-assigned ids', () => {
    const parsed = putPlanRequestSchema.parse({
      days: [
        { dayIndex: 0, date: '2026-05-12', title: null, stops: [sampleStop] },
      ],
    });

    expect(parsed.days[0]?.stops[0]?.name).toBe('Alfama');
  });

  it('rejects an empty plan', () => {
    expect(putPlanRequestSchema.safeParse({ days: [] }).success).toBe(false);
  });

  it('rejects a stop with an id — the service assigns those', () => {
    expect(
      putPlanRequestSchema.safeParse({
        days: [
          {
            dayIndex: 0,
            date: '2026-05-12',
            title: null,
            stops: [
              { ...sampleStop, id: '00000000-0000-4000-8000-000000000000' },
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects coordinates off the globe', () => {
    expect(
      putPlanRequestSchema.safeParse({
        days: [
          {
            dayIndex: 0,
            date: '2026-05-12',
            title: null,
            stops: [{ ...sampleStop, lat: 120 }],
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe('putSelectionRequest', () => {
  const selection = {
    offerSnapshot: { hotel: { name: 'Sample stay' } },
    provider: 'liteapi',
    deepLink: 'https://example.com/offer/1',
    price: { amountMinor: 48000, currency: 'EUR' },
    checkedAt: '2026-05-01T09:00:00.000Z',
  };

  it('takes the offer snapshot as shown', () => {
    expect(putSelectionRequestSchema.parse(selection)).toEqual(selection);
  });

  it('requires a deep link, since that is how every part is booked', () => {
    expect(
      putSelectionRequestSchema.safeParse({
        ...selection,
        deepLink: 'not-a-url',
      }).success,
    ).toBe(false);
  });

  it('rejects an unknown provider', () => {
    expect(
      putSelectionRequestSchema.safeParse({ ...selection, provider: 'booking' })
        .success,
    ).toBe(false);
  });
});

describe('selectionParams', () => {
  it('accepts the three bookable kinds', () => {
    const id = '00000000-0000-4000-8000-000000000000';

    for (const kind of ['flight', 'stay', 'ticket']) {
      expect(selectionParamsSchema.safeParse({ id, kind }).success).toBe(true);
    }
    expect(selectionParamsSchema.safeParse({ id, kind: 'car' }).success).toBe(
      false,
    );
  });
});

describe('response schemas', () => {
  it('a trip detail carries its spots, days and selections', () => {
    const parsed = tripDetailSchema.parse({
      id: '00000000-0000-4000-8000-000000000000',
      status: 'draft',
      styles: ['views', 'culture', 'food'],
      pace: 'balanced',
      destinationId: 'lisbon',
      destinationName: 'Lisbon',
      startDate: '2026-05-12',
      endDate: '2026-05-16',
      adults: 2,
      originAirport: 'TLV',
      childrenAges: [],
      updatedAt: '2026-05-01T09:00:00.000Z',
      spots: [{ spotId: 'lisbon-alfama', name: 'Alfama' }],
      days: [],
      selections: [],
    });

    expect(parsed.spots).toHaveLength(1);
  });

  it('a response keeps parsing when the service adds a field', () => {
    expect(
      profileSchema.safeParse({
        userId: '00000000-0000-4000-8000-000000000000',
        name: null,
        homeAirport: 'TLV',
        currency: 'EUR',
        createdAt: '2026-05-01T09:00:00.000Z',
        somethingNew: true,
      }).success,
    ).toBe(true);
  });
});

describe('offerSnapshotSchemas', () => {
  it('needs a stay snapshot to be a hotel offer, while tickets stay open', () => {
    expect(
      offerSnapshotSchemas.stay.safeParse({ hotel: { name: 'Sample stay' } })
        .success,
    ).toBe(false);
    expect(
      offerSnapshotSchemas.ticket.safeParse({ any: 'thing' }).success,
    ).toBe(true);
  });
});
