import { useQuery } from '@tanstack/react-query';
import { destinationQuery } from '../utils/destinationQueries';

/** One destination (curated or added from search), e.g. for its coordinates. */
export const useDestination = (destinationId: string | null) =>
  useQuery(destinationQuery(destinationId));
