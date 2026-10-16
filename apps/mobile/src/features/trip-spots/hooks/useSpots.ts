import { useQuery } from '@tanstack/react-query';
import type { TripStyle } from '@waypoint/contracts/trips';
import { spotsQuery } from '../utils/spotsQuery';

export const useSpots = (
  destinationId: string | null,
  styles: readonly TripStyle[],
) => useQuery(spotsQuery(destinationId, styles));
