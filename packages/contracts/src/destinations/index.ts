export {
  destinationSchema,
  destinationSuggestionSchema,
} from './destination.ts';
export type { Destination, DestinationSuggestion } from './destination.ts';
export { DAILY_VISIT_MINUTES, daysNeeded } from './pace.ts';
export {
  addDestinationBodySchema,
  destinationParamsSchema,
  getDestinationResponseSchema,
  getSpotRatingResponseSchema,
  getSpotResponseSchema,
  listDestinationsQuerySchema,
  listDestinationsResponseSchema,
  listSpotsQuerySchema,
  listSpotsResponseSchema,
  spotParamsSchema,
} from './routes.ts';
export type {
  AddDestinationBody,
  DestinationParams,
  GetDestinationResponse,
  GetSpotRatingResponse,
  GetSpotResponse,
  ListDestinationsQuery,
  ListDestinationsResponse,
  ListSpotsQuery,
  ListSpotsResponse,
  SpotParams,
} from './routes.ts';
export {
  feeSchema,
  openingHoursSchema,
  openingPeriodSchema,
  spotCategorySchema,
  spotRatingSchema,
  spotSchema,
} from './spot.ts';
export type {
  Fee,
  OpeningHours,
  OpeningPeriod,
  Spot,
  SpotCategory,
  SpotRating,
} from './spot.ts';
/** A photo with its licence credit — defined in `common`, re-exported where destinations and spots use it. */
export { photoSchema } from '../common/index.ts';
export type { Photo } from '../common/index.ts';
