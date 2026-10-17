import type {
  DestinationSuggestion,
  Photo,
} from '@waypoint/contracts/destinations';
import type { TripListItem } from '@waypoint/contracts/trips';

export type HeroBackdrop = { readonly place: string; readonly photo: Photo };

/** The hero's photo: the next trip's destination if one has a photo, else the first suggested place's; `null` for plain midnight. */
export const heroBackdrop = (
  upcoming: readonly Pick<
    TripListItem,
    'destinationName' | 'destinationPhoto'
  >[],
  places: readonly Pick<DestinationSuggestion, 'name' | 'photo'>[],
): HeroBackdrop | null =>
  [
    ...upcoming.flatMap((trip) =>
      trip.destinationPhoto === null || trip.destinationName === null
        ? []
        : [{ place: trip.destinationName, photo: trip.destinationPhoto }],
    ),
    ...places.flatMap((place) =>
      place.photo === null ? [] : [{ place: place.name, photo: place.photo }],
    ),
  ][0] ?? null;
