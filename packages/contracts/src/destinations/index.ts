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
  photoSchema,
  spotCategorySchema,
  spotRatingSchema,
  spotSchema,
} from './spot.ts';
export type {
  Fee,
  OpeningHours,
  OpeningPeriod,
  Photo,
  Spot,
  SpotCategory,
  SpotRating,
} from './spot.ts';
