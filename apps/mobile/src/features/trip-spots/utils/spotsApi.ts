import {
  listSpotsResponseSchema,
  type Spot,
} from '@waypoint/contracts/destinations';
import type { TripStyle } from '@waypoint/contracts/trips';
import { apiRequest } from '@/shared/utils/apiClient';

/** The destination's published spots, best fit for the styles first. */
export const fetchSpots = async (
  destinationId: string,
  styles: readonly TripStyle[],
): Promise<readonly Spot[]> =>
  (
    await apiRequest(
      `/destinations/${encodeURIComponent(destinationId)}/spots?styles=${encodeURIComponent(styles.join(','))}`,
      listSpotsResponseSchema,
    )
  ).spots;
