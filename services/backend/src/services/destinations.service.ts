import {
  err,
  ok,
  type CountryCode,
  type IataCode,
  type Result,
} from '@waypoint/contracts/common';
import type {
  AddDestinationBody,
  GetDestinationResponse,
  GetSpotRatingResponse,
  GetSpotResponse,
  ListDestinationsQuery,
  ListDestinationsResponse,
  ListSpotsQuery,
  ListSpotsResponse,
} from '@waypoint/contracts/destinations';
import type { Place } from '@waypoint/contracts/geo';
import type { GooglePlaces } from '../providers/google/places.ts';
import type { DestinationsRepository } from '../repositories/destinations.repository.ts';
import {
  conflict,
  fromProviderResult,
  invalidRequest,
  notFound,
  type ServiceError,
} from './errors.ts';
import {
  rankDestinations,
  rankSpots,
  searchedDestinationId,
} from './destinations.logic.ts';
import { cityAirport } from './geo.logic.ts';
import type { GeoService } from './geo.service.ts';

type Outcome<T> = Promise<Result<T, ServiceError>>;

export type DestinationsService = {
  readonly list: (
    query: ListDestinationsQuery,
  ) => Outcome<ListDestinationsResponse>;
  readonly add: (body: AddDestinationBody) => Outcome<GetDestinationResponse>;
  readonly get: (destinationId: string) => Outcome<GetDestinationResponse>;
  readonly spots: (
    destinationId: string,
    query: ListSpotsQuery,
  ) => Outcome<ListSpotsResponse>;
  readonly spot: (spotId: string) => Outcome<GetSpotResponse>;
  readonly rating: (spotId: string) => Outcome<GetSpotRatingResponse>;
};

const DESTINATION_NOT_FOUND = notFound('We have no destination with that id.');
const SPOT_NOT_FOUND = notFound('We have no spot with that id.');
const NO_RATING_MESSAGE = 'There is no rating for this spot.';
const NO_RATING = notFound(NO_RATING_MESSAGE);
const NOT_A_CITY = invalidRequest('Pick a city or town.');
/** Google place types that are a city to travel to. */
const CITY_TYPES = new Set(['locality', 'postal_town', 'colloquial_area']);

/** A place that can be a destination: a city, in a known country. */
type SearchedCity = {
  readonly placeId: string;
  readonly name: string;
  readonly countryCode: CountryCode;
  readonly lat: number;
  readonly lng: number;
};

const toSearchedCity = (place: Place): Result<SearchedCity, ServiceError> =>
  place.countryCode === null || !place.types.some((t) => CITY_TYPES.has(t))
    ? err(NOT_A_CITY)
    : ok({
        placeId: place.placeId,
        name: place.name,
        countryCode: place.countryCode,
        lat: place.lat,
        lng: place.lng,
      });

export const createDestinationsService = ({
  destinations,
  geo,
  places,
}: {
  readonly destinations: DestinationsRepository;
  readonly geo: GeoService;
  /** Absent until a Google Places key is configured; ratings are then simply unavailable. */
  readonly places: GooglePlaces | undefined;
}): DestinationsService => {
  /** The airport to fly into for a searched city; not found when none is near. */
  const airportFor = async (
    city: SearchedCity,
  ): Promise<Result<IataCode, ServiceError>> => {
    const airports = await geo.airports({ q: city.name });

    if (!airports.ok) return airports;

    const airport = cityAirport(airports.value.airports, city);

    return airport === undefined
      ? err(notFound(`We couldn't find an airport for ${city.name} yet.`))
      : ok(airport.iata);
  };

  /** The country's name, or its code when the country list can't be had. */
  const countryNameOf = async (countryCode: CountryCode): Promise<string> => {
    const countries = await geo.countries();

    return (
      (countries.ok
        ? countries.value.countries.find((c) => c.code === countryCode)?.name
        : undefined) ?? countryCode
    );
  };

  return {
    list: async ({ styles }) => {
      const all = await destinations.listPublished();
      const priced = await Promise.all(
        all.map(async (destination) => {
          // The price index is an estimate and cached for a day; without it the suggestion still stands.
          const prices = await geo.cityPrices(
            {
              countryCode: destination.countryCode,
              cityName: destination.name,
            },
            {},
          );

          return {
            destination,
            stayPerNight: prices.ok ? prices.value.averagePerNight : null,
          };
        }),
      );

      return ok({ destinations: rankDestinations(priced, styles) });
    },

    add: async ({ placeId }) => {
      const found = await geo.place(placeId);

      if (!found.ok) return found;

      const city = toSearchedCity(found.value.place);

      if (!city.ok) return city;

      const known = await destinations.findForPlace(city.value);

      if (known !== undefined) return ok({ destination: known });

      const airport = await airportFor(city.value);

      if (!airport.ok) return airport;

      await destinations.addSearched({
        ...city.value,
        id: searchedDestinationId(
          city.value.name,
          city.value.countryCode,
          city.value.placeId,
        ),
        countryName: await countryNameOf(city.value.countryCode),
        airport: airport.value,
      });

      const added = await destinations.findForPlace(city.value);

      // Only a same-named city in the same country (a different place) can block the add.
      return added === undefined
        ? err(
            conflict(
              `We already have another ${city.value.name} in this country.`,
            ),
          )
        : ok({ destination: added });
    },

    get: async (destinationId) => {
      const destination = await destinations.findOffered(destinationId);

      return destination === undefined
        ? err(DESTINATION_NOT_FOUND)
        : ok({ destination });
    },

    spots: async (destinationId, { styles }) => {
      if ((await destinations.findOffered(destinationId)) === undefined)
        return err(DESTINATION_NOT_FOUND);

      return ok({
        spots: rankSpots(await destinations.spotsOf(destinationId), styles),
      });
    },

    spot: async (spotId) => {
      const spot = await destinations.findSpot(spotId);

      return spot === undefined ? err(SPOT_NOT_FOUND) : ok({ spot });
    },

    rating: async (spotId) => {
      const spot = await destinations.googlePlaceIdOf(spotId);

      if (spot.kind === 'not-found') return err(SPOT_NOT_FOUND);

      if (spot.kind === 'no-place' || places === undefined)
        return err(NO_RATING);

      return fromProviderResult(
        'google',
        await places.rating(spot.placeId),
        (rating) => ({ rating }),
        NO_RATING_MESSAGE,
      );
    },
  };
};
