import type { DestinationSuggestion } from '@waypoint/contracts/destinations';
import type { PlaceSuggestion } from '@waypoint/contracts/geo';
import { fold } from '@/shared/utils/text';

/**
 * Searched cities that aren't already shown as one of our destinations —
 * "Lisbon, Portugal" from search is the curated Lisbon card above it.
 */
export const otherCities = (
  places: readonly PlaceSuggestion[],
  shown: readonly DestinationSuggestion[],
): PlaceSuggestion[] =>
  places.filter(
    (place) =>
      !shown.some(
        (destination) =>
          fold(destination.name) === fold(place.name) &&
          fold(place.address).includes(fold(destination.countryName)),
      ),
  );
