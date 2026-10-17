export {
  cancellationSchema,
  hotelDetailSchema,
  hotelLocationSchema,
  hotelOfferSchema,
  hotelReviewSchema,
  hotelReviewsSchema,
  hotelSearchLocationSchema,
  hotelSummarySchema,
  MAX_STOPS,
  stopPointSchema,
  travelerTypeSchema,
} from './hotel.ts';
export type {
  Cancellation,
  HotelDetail,
  HotelLocation,
  HotelOffer,
  HotelSearchLocation,
  HotelSummary,
  HotelReview,
  HotelReviews,
  StopPoint,
  TravelerType,
} from './hotel.ts';
export {
  getHotelResponseSchema,
  getHotelReviewsResponseSchema,
  hotelParamsSchema,
  DEFAULT_GUEST_NATIONALITY,
  hotelSearchRequestSchema,
  hotelSearchResponseSchema,
  listHotelsQuerySchema,
  listHotelsResponseSchema,
} from './routes.ts';
export type {
  GetHotelResponse,
  GetHotelReviewsResponse,
  HotelParams,
  HotelSearchRequest,
  HotelSearchResponse,
  ListHotelsQuery,
  ListHotelsResponse,
} from './routes.ts';
