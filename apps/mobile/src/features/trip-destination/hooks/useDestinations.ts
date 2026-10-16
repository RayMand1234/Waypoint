import { useQuery } from '@tanstack/react-query';
import type { TripStyle } from '@waypoint/contracts/trips';
import { destinationsQuery } from '../utils/destinationQueries';

export const useDestinations = (styles: readonly TripStyle[]) =>
  useQuery(destinationsQuery(styles));
