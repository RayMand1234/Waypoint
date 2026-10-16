import {
  destinationSuggestionSchema,
  type DestinationSuggestion,
} from '@waypoint/contracts/destinations';
import type { PlaceSuggestion } from '@waypoint/contracts/geo';
import { otherCities } from './citySearch';

const lisbon: DestinationSuggestion = destinationSuggestionSchema.parse({
  id: 'lisbon',
  name: 'Lisbon',
  countryCode: 'PT',
  countryName: 'Portugal',
  airport: 'LIS',
  lat: 38.7,
  lng: -9.1,
  placeId: null,
  styles: [],
  photo: null,
  spotCount: 62,
  matchedStyles: [],
  stayPerNight: null,
  isBestMatch: true,
});

const place = (name: string, address: string): PlaceSuggestion => ({
  placeId: `${name}-${address}`,
  name,
  address,
  types: ['locality'],
});

describe('otherCities', () => {
  it('drops cities already shown as our destinations', () => {
    const places = [
      place('Lisbon', 'Portugal'),
      place('Lisbon', 'ME, USA'),
      place('Lisboa', 'Portugal'),
    ];

    expect(otherCities(places, [lisbon]).map((p) => p.address)).toEqual([
      'ME, USA',
      'Portugal',
    ]);
  });
});
