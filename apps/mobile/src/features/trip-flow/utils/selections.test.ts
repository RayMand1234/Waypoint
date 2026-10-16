import { isoDateTimeSchema } from '@waypoint/contracts/common';
import { tripDetailSchema } from '@waypoint/contracts/trips';
import { lowestSource, withSelection } from './selections';

describe('lowestSource', () => {
  it('picks the cheapest site', () => {
    const at = isoDateTimeSchema.parse('2027-04-01T10:00:00.000Z');
    const source = (id: string, amountMinor: number) => ({
      provider: 'liteapi' as const,
      providerOfferId: id,
      price: { amountMinor, currency: 'EUR' as const },
      deepLink: `https://book.example/${id}`,
      checkedAt: at,
    });

    expect(
      lowestSource([source('a', 300), source('b', 200)])?.providerOfferId,
    ).toBe('b');
    expect(lowestSource([])).toBeUndefined();
  });
});

describe('withSelection', () => {
  it('replaces the selection of the same kind', () => {
    const selection = {
      kind: 'stay' as const,
      offerSnapshot: {},
      provider: 'liteapi' as const,
      deepLink: 'https://book.example/new',
      price: { amountMinor: 1, currency: 'EUR' as const },
      checkedAt: isoDateTimeSchema.parse('2027-04-01T10:00:00.000Z'),
      bookedAt: null,
    };
    const trip = tripDetailSchema.parse({
      id: '00000000-0000-4000-8000-000000000001',
      status: 'draft',
      styles: [],
      pace: 'balanced',
      destinationId: null,
      destinationName: null,
      startDate: null,
      endDate: null,
      originAirport: null,
      adults: 2,
      childrenAges: [],
      updatedAt: '2027-04-01T10:00:00.000Z',
      spots: [],
      days: [],
      selections: [{ ...selection, deepLink: 'https://book.example/old' }],
    });

    expect(withSelection(trip, selection).selections).toEqual([selection]);
  });
});
