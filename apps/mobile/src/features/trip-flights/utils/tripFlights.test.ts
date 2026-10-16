import { iataCodeSchema, isoDateSchema } from '@waypoint/contracts/common';
import {
  flightOfferSchema,
  type FlightOffer,
} from '@waypoint/contracts/flights';
import { airlinesOf, flightCard, legTimes, stopsOf } from './flightCardModel';
import { fareRows, legDetail } from './flightDetails';
import { filterFlights, toggleFilter } from './flightFilters';
import { flightRequest } from './flightRequest';
import { flightResultsState } from './flightResults';

const segment = (
  from: string,
  to: string,
  departAt: string,
  arriveAt: string,
  carrier = 'TAP Air Portugal',
) => ({
  from,
  fromName: null,
  to,
  toName: to === 'MUC' ? 'Munich International Airport' : null,
  departAt,
  arriveAt,
  carrier: {
    code: carrier.slice(0, 2).toUpperCase(),
    name: carrier,
    logoUrl: null,
  },
  flightNumber: '123',
  durationMinutes: 300,
});

const offer = (
  id: string,
  overrides: Record<string, unknown> = {},
): FlightOffer =>
  flightOfferSchema.parse({
    id,
    legs: [
      {
        direction: 'outbound',
        departAt: '2027-05-12T08:10:00',
        arriveAt: '2027-05-12T11:25:00',
        durationMinutes: 315,
        stops: 0,
        segments: [
          segment('TLV', 'LIS', '2027-05-12T08:10:00', '2027-05-12T11:25:00'),
        ],
      },
      {
        direction: 'inbound',
        departAt: '2027-05-16T17:30:00',
        arriveAt: '2027-05-17T00:35:00',
        durationMinutes: 305,
        stops: 0,
        segments: [
          segment('LIS', 'TLV', '2027-05-16T17:30:00', '2027-05-17T00:35:00'),
        ],
      },
    ],
    bestPrice: { amountMinor: 37_800, currency: 'EUR' },
    refundable: null,
    changeable: true,
    baggage: { carryOn: true, checked: true },
    seatsRemaining: 3,
    expiresAt: null,
    sources: [
      {
        provider: 'liteapi',
        providerOfferId: `o-${id}`,
        price: { amountMinor: 37_800, currency: 'EUR' },
        deepLink: `https://book.example/${id}`,
        checkedAt: '2027-04-01T10:00:00.000Z',
      },
    ],
    value: {
      score: 1,
      isBestValue: false,
      savingsVsAverage: { amountMinor: 0, currency: 'EUR' },
    },
    ...overrides,
  });

const viaMunich = offer('lh', {
  legs: [
    {
      direction: 'outbound',
      departAt: '2027-05-12T05:00:00',
      arriveAt: '2027-05-12T12:40:00',
      durationMinutes: 520,
      stops: 1,
      segments: [
        segment(
          'TLV',
          'MUC',
          '2027-05-12T05:00:00',
          '2027-05-12T08:30:00',
          'Lufthansa',
        ),
        segment(
          'MUC',
          'LIS',
          '2027-05-12T09:40:00',
          '2027-05-12T12:40:00',
          'Lufthansa',
        ),
      ],
    },
  ],
  baggage: { carryOn: true, checked: false },
  changeable: false,
  seatsRemaining: null,
});

describe('flightRequest', () => {
  const trip = {
    originAirport: iataCodeSchema.parse('TLV'),
    startDate: isoDateSchema.parse('2027-05-12'),
    endDate: isoDateSchema.parse('2027-05-16'),
    adults: 2,
    childrenAges: [1, 8],
  };

  it('flies the whole party round trip, babies as infants', () => {
    const request = flightRequest(trip, iataCodeSchema.parse('LIS'), 'EUR');

    expect(request.ok && request.value).toMatchObject({
      origin: 'TLV',
      destination: 'LIS',
      departDate: '2027-05-12',
      returnDate: '2027-05-16',
      adults: 2,
      children: 1,
      infants: 1,
    });
  });

  it("says what's missing", () => {
    const request = flightRequest(
      { ...trip, originAirport: null },
      iataCodeSchema.parse('LIS'),
      'EUR',
    );

    expect(request.ok ? undefined : request.error).toBe(
      'Choose where you fly from in step 2.',
    );
  });
});

describe('flightFilters', () => {
  it('keeps the fares that pass every chosen filter', () => {
    const offers = [offer('tap'), viaMunich];
    const ids = (filters: Parameters<typeof filterFlights>[1]) =>
      filterFlights(offers, filters).map((o) => o.id);

    expect(ids([])).toEqual(['tap', 'lh']);
    expect(ids(['direct'])).toEqual(['tap']);
    expect(ids(['checked-bag', 'flexible'])).toEqual(['tap']);
    expect(ids(['morning'])).toEqual(['tap', 'lh']);
    expect(toggleFilter(['direct'], 'direct')).toEqual([]);
  });
});

describe('flightCard', () => {
  it('words a fare: airlines, stops, times and a seats warning', () => {
    const card = flightCard(offer('tap'), undefined, 2);

    expect(card.title).toBe('TAP Air Portugal');
    expect(card.meta).toBe('Checked bag included');
    expect(card.legs.map((leg) => leg.label)).toEqual(['Out', 'Back']);
    expect(card.legs[0]?.text).toBe('Wed 12 · 08:10 → 11:25 · 5h 15m');
    expect(card.unit).toBe('2 travelers · round trip');
    expect(card.badges).toEqual([
      { kind: 'neutral', label: 'Direct' },
      { kind: 'warning', label: '3 seats left' },
    ]);
  });

  it('marks an overnight landing and names the stop', () => {
    const back = offer('tap').legs[1];

    expect(back === undefined ? '' : legTimes(back)).toBe('17:30 → 00:35 +1');
    expect(stopsOf(viaMunich)).toBe('1 stop · MUC');
    expect(airlinesOf(viaMunich)).toBe('Lufthansa');
  });
});

describe('flight details', () => {
  it('spells out a change of plane and the fare terms', () => {
    const out = viaMunich.legs[0];

    expect(out === undefined ? '' : legDetail(out).meta).toBe(
      'TLV → LIS · 8h 40m · Change in Munich (1h 10m)',
    );
    expect(fareRows(viaMunich)).toEqual([
      ['Bags', 'Cabin bag only'],
      ['Changes', 'No changes'],
      ['Refunds', 'Check the fare terms'],
      ['Seats', 'Check on the site'],
    ]);
  });
});

describe('flightResultsState', () => {
  it('tells filtered-out fares from none found', () => {
    const response = { offers: [offer('tap')], errors: [] };

    expect(
      flightResultsState({ status: 'success', response }, [], ''),
    ).toMatchObject({ status: 'loaded', isFilteredOut: true });
    expect(
      flightResultsState({ status: 'no-request' }, [], 'Set your dates.'),
    ).toEqual({ status: 'error', message: 'Set your dates.' });
  });
});
