import { isoDateSchema, isoDateTimeSchema } from '@waypoint/contracts/common';
import { hotelOfferSchema, type HotelOffer } from '@waypoint/contracts/hotels';
import { spotSchema, type Spot } from '@waypoint/contracts/destinations';
import { formatMoney } from '@/shared/utils/format';
import { stayCard, stayHighlights, stayPhotos } from './stayCardModel';
import { stayResultsState } from './stayResults';
import { orderStays } from './stayOrder';
import { pickedStops, stayRequest } from './stayRequest';
import { selectionOf } from '@/features/trip-flow';
import { chosenHotelId } from './staySelection';

const offer = (
  id: string,
  totalMinor: number,
  overrides: Record<string, unknown> = {},
  hotel: Record<string, unknown> = {},
): HotelOffer =>
  hotelOfferSchema.parse({
    hotel: {
      id,
      name: `Hotel ${id}`,
      address: null,
      cityName: 'Lisbon',
      countryCode: 'PT',
      lat: 38.71,
      lng: -9.13,
      stars: 4,
      rating: 8.5,
      reviewCount: null,
      mainPhotoUrl: null,
      thumbnailUrl: null,
      ...hotel,
    },
    roomName: 'Double room',
    boardName: null,
    cancellation: 'refundable',
    nights: 4,
    bestPrice: { amountMinor: totalMinor, currency: 'EUR' },
    pricePerNight: { amountMinor: totalMinor / 4, currency: 'EUR' },
    distanceMeters: 900,
    stopsMinutes: 12,
    isBestLocation: false,
    sources: [
      {
        provider: 'liteapi',
        providerOfferId: `o-${id}`,
        price: { amountMinor: totalMinor, currency: 'EUR' },
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

const eur = (amountMinor: number): string =>
  formatMoney({ amountMinor, currency: 'EUR' });
const SPOT_A = '00000000-0000-4000-8000-00000000000a';
const SPOT_B = '00000000-0000-4000-8000-00000000000b';

const spot = (id: string, popularity: number, lat: number): Spot =>
  spotSchema.parse({
    id,
    destinationId: 'lisbon',
    name: `Spot ${id}`,
    category: 'landmark',
    styles: ['views'],
    lat,
    lng: -9.13,
    address: null,
    description: null,
    website: null,
    visitMinutes: 60,
    popularity,
    photo: null,
    openingHours: null,
    fee: { kind: 'unknown' },
    hasRating: false,
    checkedAt: '2027-04-01T10:00:00.000Z',
  });

describe('stayRequest', () => {
  const trip = {
    startDate: isoDateSchema.parse('2027-05-12'),
    endDate: isoDateSchema.parse('2027-05-16'),
    adults: 2,
    childrenAges: [],
    spots: [{ spotId: SPOT_B, name: 'Spot b' }],
  };
  const centre = { lat: 38.72, lng: -9.14 };

  it('searches around the picked spots only', () => {
    const spots = [spot(SPOT_A, 90, 38.7), spot(SPOT_B, 50, 38.8)];

    expect(pickedStops(trip, spots)).toEqual([{ lat: 38.8, lng: -9.13 }]);
    expect(stayRequest(trip, spots, centre, 'EUR')?.location).toEqual({
      type: 'stops',
      stops: [{ lat: 38.8, lng: -9.13 }],
    });
  });

  it('searches around the city centre without spots, and not at all without a night', () => {
    expect(stayRequest(trip, [], centre, 'EUR')?.location).toMatchObject({
      type: 'coordinates',
      ...centre,
    });
    expect(
      stayRequest(
        { ...trip, endDate: isoDateSchema.parse('2027-05-12') },
        [],
        centre,
        'EUR',
      ),
    ).toBeUndefined();
  });
});

describe('orderStays', () => {
  const offers = [
    offer('value', 40_000, {}, { rating: 8 }),
    offer('cheap', 30_000, {}, { rating: 7 }),
    offer('top', 60_000, {}, { rating: 9.5 }),
  ];

  it('keeps the server order for best value and sorts the other modes', () => {
    const ids = (mode: Parameters<typeof orderStays>[1]) =>
      orderStays(offers, mode).map((o) => o.hotel.id);

    expect(ids('value')).toEqual(['value', 'cheap', 'top']);
    expect(ids('cheapest')).toEqual(['cheap', 'value', 'top']);
    expect(ids('quality')).toEqual(['top', 'value', 'cheap']);
  });
});

describe('stayCard', () => {
  const best = offer('best', 40_000, {
    isBestLocation: true,
    value: {
      score: 1.4,
      isBestValue: true,
      savingsVsAverage: { amountMinor: 4_100, currency: 'EUR' },
    },
  });
  const pricier = offer('pricier', 52_000, { stopsMinutes: null });
  const all = [best, pricier];

  it('words the best value stay with its badges, nearness and savings', () => {
    expect(stayCard(best, stayHighlights(all))).toEqual({
      title: 'Hotel best',
      meta: '8.5 rating · Double room · Free cancellation',
      note: '≈ 12 min to your spots',
      price: eur(40_000),
      unit: `4 nights · ${eur(10_000)} / night`,
      delta: { text: `−${eur(4_100)} vs avg`, direction: 'down' },
      badges: [
        { kind: 'value', label: 'Best value' },
        { kind: 'neutral', label: 'Best location' },
        { kind: 'savings', label: 'Cheapest' },
        { kind: 'neutral', label: 'Top rated' },
      ],
      isBestValue: true,
    });
  });

  it('compares another stay with the best value, and falls back to distance', () => {
    const card = stayCard(pricier, stayHighlights(all));

    expect(card.delta).toEqual({
      text: `+${eur(12_000)} vs best value`,
      direction: 'up',
    });
    expect(card.note).toBe('0.9 km from the centre');
    expect(card.badges).toEqual([]);
  });
});

describe('staySelection', () => {
  it('snapshots the offer with its lowest source, and reads the chosen hotel back', () => {
    const chosen = offer('casa', 38_400);
    const selection = selectionOf(chosen);

    expect(selection).toMatchObject({
      provider: 'liteapi',
      deepLink: 'https://book.example/casa',
      price: { amountMinor: 38_400, currency: 'EUR' },
    });
    expect(
      chosenHotelId({
        selections: [
          {
            kind: 'stay',
            offerSnapshot: selection?.offerSnapshot ?? {},
            provider: 'liteapi',
            deepLink: 'https://book.example/casa',
            price: { amountMinor: 38_400, currency: 'EUR' },
            checkedAt: isoDateTimeSchema.parse('2027-04-01T10:00:00.000Z'),
            bookedAt: null,
          },
        ],
      }),
    ).toBe('casa');
    expect(chosenHotelId({ selections: [] })).toBeUndefined();
  });
});

describe('stayResultsState', () => {
  const offers = [offer('a', 40_000)];
  const highlights = stayHighlights(offers);

  it('says why there is nothing to show, or what to show', () => {
    expect(
      stayResultsState({ status: 'no-request' }, offers, highlights),
    ).toMatchObject({ status: 'error' });
    expect(stayResultsState({ status: 'pending' }, offers, highlights)).toEqual(
      { status: 'loading' },
    );
    expect(
      stayResultsState(
        { status: 'success', response: { offers, errors: [] } },
        offers,
        highlights,
      ),
    ).toMatchObject({ status: 'loaded', hasMissingSources: false });
  });
});

describe('stayPhotos', () => {
  it('uses the gallery once loaded, else the main photo', () => {
    const withPhoto = offer(
      'p',
      1_000,
      {},
      {
        mainPhotoUrl: 'https://img.example/main.jpg',
      },
    );

    expect(stayPhotos(withPhoto, undefined)).toEqual([
      'https://img.example/main.jpg',
    ]);
    expect(stayPhotos(offer('q', 1_000), undefined)).toEqual([]);
  });
});
