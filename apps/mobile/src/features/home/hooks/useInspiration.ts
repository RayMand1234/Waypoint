import { useQuery } from '@tanstack/react-query';
import type { DestinationSuggestion } from '@waypoint/contracts/destinations';
import type { TripStyle } from '@waypoint/contracts/trips';
import { destinationsQuery } from '@/features/trip-destination';

/** Home shows the first four: a wide tile, a tall one and two squares. */
const TILES = 4;

/** Places worth the trip for these styles, best match first; empty while loading or when the call fails (the section hides). */
export const useInspiration = (
  styles: readonly TripStyle[],
): readonly DestinationSuggestion[] => {
  const query = useQuery(destinationsQuery(styles));

  return (query.data ?? []).slice(0, TILES);
};
