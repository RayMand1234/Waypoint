import {
  tripListItemSchema,
  type TripListItem,
} from '@waypoint/contracts/trips';
import { splitTrips, toTripCard } from './tripCardModel';

const trip = (overrides: Record<string, unknown> = {}): TripListItem =>
  tripListItemSchema.parse({
    id: '6f0c6f3a-3c55-4b8e-9a8a-1f1b2c3d4e5f',
    status: 'draft',
    styles: ['views', 'food'],
    pace: 'balanced',
    destinationId: 'ChIJ-lisbon',
    destinationName: 'Lisbon',
    startDate: '2027-05-12',
    endDate: '2027-05-16',
    adults: 2,
    originAirport: 'TLV',
    childrenAges: [],
    updatedAt: '2027-04-01T10:00:00.000Z',
    planDays: 0,
    selections: [],
    destinationPhoto: null,
    ...overrides,
  });

describe('toTripCard', () => {
  it('shows a draft with its progress and where it resumes', () => {
    expect(toTripCard(trip())).toMatchObject({
      title: 'Lisbon',
      code: 'LIS',
      tone: 'draft',
      line: '12–16 May · 2 travelers',
      pill: 'Draft',
      progress: 3,
      action: { text: 'Continue · Flights', isLink: true },
      target: { kind: 'step', step: 'flights' },
    });
  });

  it('handles a brand-new draft with nothing picked', () => {
    expect(
      toTripCard(
        trip({
          styles: [],
          destinationName: null,
          destinationId: null,
          startDate: null,
          endDate: null,
        }),
      ),
    ).toMatchObject({
      title: 'New waypoint',
      code: null,
      line: 'Dates not set · 2 travelers',
      progress: 0,
      target: { kind: 'step', step: 'style' },
    });
  });

  it('says what is ready on a booked trip', () => {
    expect(
      toTripCard(
        trip({ status: 'booked', planDays: 4, selections: ['flight', 'stay'] }),
      ),
    ).toMatchObject({
      tone: 'ready',
      pill: 'Booked',
      action: { text: 'Flight, stay and 4-day plan ready', isLink: false },
      progress: null,
    });
  });

  it('lets only a draft be deleted', () => {
    expect(toTripCard(trip()).canDelete).toBe(true);
    expect(toTripCard(trip({ status: 'past' })).canDelete).toBe(false);
  });

  it('offers to plan a past trip again', () => {
    expect(toTripCard(trip({ status: 'past' }))).toMatchObject({
      tone: 'past',
      pill: 'Past',
      action: { text: 'Plan it again', isLink: true },
      target: { kind: 'plan-again' },
    });
  });

  it('reads the whole postcard to a screen reader', () => {
    expect(toTripCard(trip()).label).toBe(
      'Lisbon, 12–16 May · 2 travelers, draft, 3 of 6 steps. Continue · Flights.',
    );
  });

  it('keeps past trips out of the rail, for the stamps', () => {
    const { upcoming, past } = splitTrips([
      trip({ id: '00000000-0000-4000-8000-000000000001' }),
      trip({ id: '00000000-0000-4000-8000-000000000002', status: 'past' }),
    ]);

    expect(upcoming.map((t) => t.status)).toEqual(['draft']);
    expect(past.map((t) => t.status)).toEqual(['past']);
  });
});
