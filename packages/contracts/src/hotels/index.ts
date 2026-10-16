export {
  cancellationSchema,
  hotelDetailSchema,
  hotelLocationSchema,
  hotelOfferSchema,
  hotelSearchLocationSchema,
  hotelSummarySchema,
  MAX_STOPS,
  stopPointSchema,
} from './hotel.ts';
export type {
  Cancellation,
  HotelDetail,
  HotelLocation,
  HotelOffer,
  HotelSearchLocation,
  HotelSummary,
  StopPoint,
} from './hotel.ts';
export {
  getHotelResponseSchema,
  hotelParamsSchema,
  DEFAULT_GUEST_NATIONALITY,
  hotelSearchRequestSchema,
  hotelSearchResponseSchema,
  listHotelsQuerySchema,
  listHotelsResponseSchema,
} from './routes.ts';
export type {
  GetHotelResponse,
  HotelParams,
  HotelSearchRequest,
  HotelSearchResponse,
  ListHotelsQuery,
  ListHotelsResponse,
} from './routes.ts';
