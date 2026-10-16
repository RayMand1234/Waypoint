import { isoDateSchema } from '@waypoint/contracts/common';
import {
  tripDayInputSchema,
  tripSelectionSchema,
  type TripSelection,
} from '@waypoint/contracts/trips';
import { storedTripSchema, type StoredTrip } from '../domain/trip.ts';
import { describe, expect, it } from 'vitest';
import {
  effectiveStatus,
  planTripUpdate,
  statusAfterBooking,
  validatePlan,
} from './trips.logic.ts';

const trip = (
  overrides: Partial<Record<keyof StoredTrip, unknown>> = {},
): StoredTrip =>
  storedTripSchema.parse({
    id: '6f0c6f3a-3c55-4b8e-9a8a-1f1b2c3d4e5f',
    status: 'planned',
    styles: ['food'],
    pace: 'balanced',
    destinationId: 'lisbon',
    destinationName: 'Lisbon',
    startDate: '2027-05-12',
    endDate: '2027-05-16',
    adults: 2,
    originAirport: 'TLV',
    childrenAges: [],
    updatedAt: '2027-04-01T10:00:00.000Z',
    ...overrides,
  });

const selection = (bookedAt: string | null): TripSelection =>
  tripSelectionSchema.parse({
    kind: 'stay',
    offerSnapshot: {},
    provider: 'liteapi',
    deepLink: 'https://book.example/hotels/lp-alfama',
    price: { amountMinor: 52050, currency: 'EUR' },
    checkedAt: '2027-04-01T10:00:00.000Z',
    bookedAt,
  });

describe('effectiveStatus', () => {
  it('reads a finished trip as past', () => {
    expect(effectiveStatus(trip(), new Date('2027-05-17T00:00:00Z'))).toBe(
      'past',
    );
  });

  it('keeps it as stored on its last day', () => {
    expect(effectiveStatus(trip(), new Date('2027-05-16T23:00:00Z'))).toBe(
      'planned',
    );
  });

  it('leaves drafts alone', () => {
    expect(
      effectiveStatus(trip({ status: 'draft' }), new Date('2030-01-01')),
    ).toBe('draft');
  });
});

describe('planTripUpdate', () => {
  it('allows draft → planned when a destination is set', () => {
    const result = planTripUpdate(trip({ status: 'draft' }), {
      status: 'planned',
    });

    expect(result).toEqual({ ok: true, value: { status: 'planned' } });
  });

  it('refuses to finish a plan with no destination', () => {
    const result = planTripUpdate(
      trip({ status: 'draft', destinationId: null }),
      { status: 'planned' },
    );

    expect(result.ok ? null : result.error.type).toBe('conflict');
  });

  it('accepts the destination arriving in the same patch', () => {
    const result = planTripUpdate(
      trip({ status: 'draft', destinationId: null }),
      {
        status: 'planned',
        destinationId: 'lisbon',
      },
    );

    expect(result.ok).toBe(true);
  });

  it('never sets booked by hand — it follows booking a selection', () => {
    expect(
      planTripUpdate(trip({ status: 'draft' }), { status: 'booked' }).ok,
    ).toBe(false);
    expect(
      planTripUpdate(trip({ status: 'planned' }), { status: 'booked' }).ok,
    ).toBe(false);
  });

  it('refuses clearing the destination together with planning (null is "clear", not "keep")', () => {
    const result = planTripUpdate(trip({ status: 'draft' }), {
      status: 'planned',
      destinationId: null,
    });

    expect(result.ok ? null : result.error.type).toBe('conflict');
  });

  it('refuses clearing the destination of a trip that is already planned', () => {
    const result = planTripUpdate(trip({ status: 'planned' }), {
      destinationId: null,
    });

    expect(result.ok ? null : result.error.type).toBe('conflict');
  });

  it('lets a draft clear its destination', () => {
    expect(
      planTripUpdate(trip({ status: 'draft' }), { destinationId: null }).ok,
    ).toBe(true);
  });

  it('refuses an end date before the start date, including against stored dates', () => {
    expect(planTripUpdate(trip(), { endDate: null, startDate: null }).ok).toBe(
      true,
    );

    const result = planTripUpdate(trip(), {
      endDate: isoDateSchema.parse('2027-05-10'),
    });

    expect(result.ok ? null : result.error.type).toBe('invalid-request');
  });

  it('never passes spots through as a column change', () => {
    const result = planTripUpdate(trip(), {
      spots: [{ spotId: 'belem', name: 'Belém' }],
      pace: 'relaxed',
    });

    expect(result).toEqual({ ok: true, value: { pace: 'relaxed' } });
  });
});

describe('validatePlan', () => {
  const day = (dayIndex: number, date: string, positions: number[]) =>
    tripDayInputSchema.parse({
      dayIndex,
      date,
      title: null,
      stops: positions.map((position) => ({
        position,
        kind: 'spot',
        spotId: `spot-${String(position)}`,
        name: 'Spot',
        lat: 38.7,
        lng: -9.1,
        startsAt: '09:30',
        minutes: 60,
        travelMinutesFromPrevious: null,
        travelMode: null,
        isFixed: false,
      })),
    });

  it('accepts days inside the trip', () => {
    expect(
      validatePlan(trip(), [
        day(0, '2027-05-12', [0, 1]),
        day(1, '2027-05-13', [0]),
      ]).ok,
    ).toBe(true);
  });

  it('refuses duplicate day indexes, duplicate stop positions and days outside the dates', () => {
    expect(
      validatePlan(trip(), [
        day(0, '2027-05-12', [0]),
        day(0, '2027-05-13', [0]),
      ]).ok,
    ).toBe(false);
    expect(validatePlan(trip(), [day(0, '2027-05-12', [0, 0])]).ok).toBe(false);
    expect(validatePlan(trip(), [day(0, '2027-05-20', [0])]).ok).toBe(false);
  });
});

describe('statusAfterBooking', () => {
  it('moves planned → booked when something is booked, and back when nothing is', () => {
    expect(
      statusAfterBooking('planned', [selection('2027-04-02T10:00:00.000Z')]),
    ).toBe('booked');
    expect(statusAfterBooking('booked', [selection(null)])).toBe('planned');
  });

  it('leaves a draft alone', () => {
    expect(
      statusAfterBooking('draft', [selection('2027-04-02T10:00:00.000Z')]),
    ).toBe('draft');
  });
});
