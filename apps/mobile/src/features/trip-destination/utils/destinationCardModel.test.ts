import {
  destinationSuggestionSchema,
  type DestinationSuggestion,
} from '@waypoint/contracts/destinations';
import { filterDestinations, toDestinationCard } from './destinationCardModel';

const suggestion = (
  overrides: Record<string, unknown> = {},
): DestinationSuggestion =>
  destinationSuggestionSchema.parse({
    id: 'lisbon',
    name: 'Lisbon',
    countryCode: 'PT',
    countryName: 'Portugal',
    airport: 'LIS',
    lat: 38.7,
    lng: -9.1,
    placeId: null,
    styles: ['culture', 'views', 'food', 'night'],
    photo: null,
    spotCount: 62,
    matchedStyles: ['views', 'food'],
    stayPerNight: { amountMinor: 15_000, currency: 'USD' },
    isBestMatch: true,
    ...overrides,
  });

describe('toDestinationCard', () => {
  it('words the best match with its estimate', () => {
    expect(toDestinationCard(suggestion())).toEqual({
      id: 'lisbon',
      code: 'LIS',
      title: 'Lisbon, Portugal',
      meta: 'Culture · Views · Food · 62 spots',
      price: 'Stays from $ 150 / night',
      why: 'Best match for your styles',
      isBestMatch: true,
    });
  });

  it('says which styles fit when it is not the best match, and drops an unknown price', () => {
    const card = toDestinationCard(
      suggestion({
        isBestMatch: false,
        stayPerNight: null,
        matchedStyles: ['food'],
      }),
    );

    expect(card.why).toBe('Good for food');
    expect(card.price).toBeNull();
  });
});

describe('filterDestinations', () => {
  const list = [
    suggestion(),
    suggestion({ id: 'porto', name: 'Porto' }),
    suggestion({ id: 'malaga', name: 'Málaga', countryName: 'Spain' }),
  ];

  it('matches the start of a city or country word, ignoring case and accents', () => {
    expect(filterDestinations(list, 'mal').map((d) => d.id)).toEqual([
      'malaga',
    ]);
    expect(filterDestinations(list, 'portu').map((d) => d.id)).toEqual([
      'lisbon',
      'porto',
    ]);
    expect(filterDestinations(list, '  ')).toHaveLength(3);
  });
});
