import type { Money } from '@waypoint/contracts/common';
import type {
  Destination,
  DestinationSuggestion,
  Spot,
} from '@waypoint/contracts/destinations';
import type { TripStyle } from '@waypoint/contracts/trips';
import { fold } from '../lib/text.ts';

// Pure ranking rules for destinations and spots: style fit first, then
// how much there is to do (destinations) or popularity (spots).

/** The wanted styles a place offers, in the order they were asked for. */
export const matchedStyles = (
  offered: readonly TripStyle[],
  wanted: readonly TripStyle[],
): TripStyle[] => wanted.filter((style) => offered.includes(style));

export type PricedDestination = {
  readonly destination: Destination;
  readonly stayPerNight: Money | null;
};

/** Best match first: most of the trip's styles, then most spots, then name. Exactly one `isBestMatch`. */
export const rankDestinations = (
  destinations: readonly PricedDestination[],
  styles: readonly TripStyle[],
): DestinationSuggestion[] =>
  destinations
    .map(({ destination, stayPerNight }) => ({
      ...destination,
      matchedStyles: matchedStyles(destination.styles, styles),
      stayPerNight,
    }))
    .toSorted(
      (a, b) =>
        b.matchedStyles.length - a.matchedStyles.length ||
        b.spotCount - a.spotCount ||
        a.name.localeCompare(b.name),
    )
    .map((suggestion, index) => ({ ...suggestion, isBestMatch: index === 0 }));

/** Spots that fit more of the trip's styles first; popularity breaks ties (and decides alone without styles). */
export const rankSpots = (
  spots: readonly Spot[],
  styles: readonly TripStyle[],
): Spot[] =>
  spots.toSorted(
    (a, b) =>
      matchedStyles(b.styles, styles).length -
        matchedStyles(a.styles, styles).length || b.popularity - a.popularity,
  );

/** Lower-case ASCII words joined by dashes: "São Paulo" → `sao-paulo`. */
const slug = (text: string): string =>
  fold(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * The id of a destination added from search: `rome-it`. Names that fold to
 * nothing readable fall back to the place id, so every city still gets one.
 */
export const searchedDestinationId = (
  name: string,
  countryCode: string,
  placeId: string,
): string => {
  const named = slug(name);

  return `${named === '' ? slug(placeId) : named}-${countryCode.toLowerCase()}`;
};
