import type {
  CountryCode,
  IsoDate,
  IsoDateTime,
  Money,
  ProviderId,
  Result,
} from '@waypoint/contracts/common';
import type {
  FlightLeg,
  FlightSearchRequest,
} from '@waypoint/contracts/flights';
import type {
  Airport,
  City,
  CityPriceIndex,
  Country,
  Place,
  PlaceSuggestion,
} from '@waypoint/contracts/geo';
import type {
  Cancellation,
  HotelDetail,
  HotelLocation,
  HotelSearchRequest,
  HotelSummary,
} from '@waypoint/contracts/hotels';

// Waypoint's side of every external source. Adapters (one folder per
// provider) implement these with the provider's own API and translate its
// responses into Waypoint's shapes; nothing past an adapter sees a provider
// field name. Services depend only on these types, so tests pass fakes.

/** Why a provider call failed. Expected, so returned — never thrown. */
export type ProviderFailure =
  | { readonly type: 'timeout' }
  | { readonly type: 'not-found' }
  | {
      readonly type: 'unavailable';
      readonly status: number | null;
      readonly message: string;
    }
  | { readonly type: 'invalid-response'; readonly message: string };

export type ProviderResult<T> = Promise<Result<T, ProviderFailure>>;

/** Countries, cities, places, airports and city price levels. */
export type GeoSource = {
  readonly id: ProviderId;
  readonly countries: () => ProviderResult<readonly Country[]>;
  readonly cities: (
    countryCode: CountryCode,
  ) => ProviderResult<readonly City[]>;
  readonly searchPlaces: (
    query: string,
    type: string | undefined,
  ) => ProviderResult<readonly PlaceSuggestion[]>;
  readonly place: (placeId: string) => ProviderResult<Place>;
  readonly airports: (query: string) => ProviderResult<readonly Airport[]>;
  readonly cityPrices: (query: {
    readonly countryCode: CountryCode;
    readonly cityName: string;
    readonly from: IsoDate | undefined;
    readonly to: IsoDate | undefined;
  }) => ProviderResult<CityPriceIndex>;
};

/** A hotel's static facts, without prices. */
export type HotelCatalog = {
  readonly id: ProviderId;
  readonly listHotels: (query: {
    readonly location: HotelLocation;
    readonly limit: number;
    readonly offset: number;
  }) => ProviderResult<readonly HotelSummary[]>;
  readonly hotel: (hotelId: string) => ProviderResult<HotelDetail>;
};

/** One hotel's cheapest room from ONE provider — adapter output, before ranking. */
export type ProviderHotelOffer = {
  readonly provider: ProviderId;
  readonly providerOfferId: string;
  readonly hotel: HotelSummary;
  readonly roomName: string;
  readonly boardName: string | null;
  readonly cancellation: Cancellation;
  /** The whole stay. */
  readonly price: Money;
  readonly deepLink: string;
  readonly checkedAt: IsoDateTime;
};

/** A price search as providers take it: the location is always one they know (never `stops`). */
export type HotelSearchQuery = Omit<HotelSearchRequest, 'location'> & {
  readonly location: HotelLocation;
};

export type HotelProvider = {
  readonly id: ProviderId;
  readonly searchHotels: (
    query: HotelSearchQuery,
    signal: AbortSignal,
  ) => ProviderResult<readonly ProviderHotelOffer[]>;
};

/** One itinerary at its cheapest fare from ONE provider. */
export type ProviderFlightOffer = {
  readonly provider: ProviderId;
  readonly providerOfferId: string;
  /** Stable id of the itinerary itself (same flights, any fare). */
  readonly itineraryId: string;
  readonly legs: readonly FlightLeg[];
  readonly price: Money;
  /** `null` when the provider didn't say. */
  readonly refundable: boolean | null;
  readonly changeable: boolean | null;
  readonly baggage: {
    readonly carryOn: boolean | null;
    readonly checked: boolean | null;
  };
  readonly seatsRemaining: number | null;
  readonly expiresAt: IsoDateTime | null;
  readonly deepLink: string;
  readonly checkedAt: IsoDateTime;
};

export type FlightProvider = {
  readonly id: ProviderId;
  readonly searchFlights: (
    query: FlightSearchRequest,
    signal: AbortSignal,
  ) => ProviderResult<readonly ProviderFlightOffer[]>;
};
