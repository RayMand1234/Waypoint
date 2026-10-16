import { isoDateSchema, isoDateTimeSchema } from '@waypoint/contracts/common';
import type { TripSelection } from '@waypoint/contracts/trips';
import { routePicks } from './routePicks';

const at = isoDateTimeSchema.parse('2027-04-01T10:00:00.000Z');
const price = { amountMinor: 1, currency: 'EUR' as const };
const source = {
  provider: 'liteapi' as const,
  providerOfferId: 'o',
  price,
  deepLink: 'https://book.example/o',
  checkedAt: at,
};
const selection = (
  kind: TripSelection['kind'],
  offerSnapshot: Record<string, unknown>,
): TripSelection => ({
  kind,
  offerSnapshot,
  provider: 'liteapi',
  deepLink: 'https://book.example/o',
  price,
  checkedAt: at,
  bookedAt: null,
});
const value = { score: 1, isBestValue: true, savingsVsAverage: price };

const stay = {
  hotel: {
    id: 'h',
    name: 'Casa do Miradouro',
    address: null,
    cityName: null,
    countryCode: null,
    lat: 38.7,
    lng: -9.1,
    stars: null,
    rating: null,
    reviewCount: null,
    mainPhotoUrl: null,
    thumbnailUrl: null,
  },
  roomName: 'Double',
  boardName: null,
  cancellation: 'unknown',
  nights: 4,
  bestPrice: price,
  pricePerNight: price,
  distanceMeters: null,
  stopsMinutes: null,
  isBestLocation: false,
  sources: [source],
  value,
};
const segment = {
  from: 'TLV',
  fromName: null,
  to: 'LIS',
  toName: null,
  departAt: '2027-05-12T08:10:00',
  arriveAt: '2027-05-12T11:25:00',
  carrier: { code: 'TP', name: 'TAP Air Portugal', logoUrl: null },
  flightNumber: '1',
  durationMinutes: 315,
};
const flight = {
  id: 'f',
  legs: [
    {
      direction: 'outbound',
      departAt: segment.departAt,
      arriveAt: segment.arriveAt,
      durationMinutes: 315,
      stops: 0,
      segments: [segment],
    },
  ],
  bestPrice: price,
  refundable: null,
  changeable: null,
  baggage: { carryOn: null, checked: null },
  seatsRemaining: null,
  expiresAt: null,
  sources: [source],
  value,
};

describe('routePicks', () => {
  const trip = {
    styles: ['views' as const, 'food' as const],
    destinationName: 'Lisbon',
    startDate: isoDateSchema.parse('2027-05-12'),
    endDate: isoDateSchema.parse('2027-05-16'),
    selections: [selection('stay', stay), selection('flight', flight)],
  };

  it('labels every passed step with its pick, a word or two each', () => {
    expect(routePicks(trip)).toEqual([
      'Views +1',
      'Lisbon',
      '5 days',
      'Casa',
      'TAP direct',
    ]);
  });

  it('stops at the first step not yet picked', () => {
    expect(routePicks({ ...trip, selections: [] })).toEqual([
      'Views +1',
      'Lisbon',
      '5 days',
    ]);
  });
});
