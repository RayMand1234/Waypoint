import type { HotelSearchRequest } from '@waypoint/contracts/hotels';

// Links into the liteAPI white-label site, where the traveler books.
// Format: https://docs.liteapi.travel/docs/deeplinking-to-whitelabel

const base = (whitelabelUrl: string): string =>
  whitelabelUrl.replace(/\/+$/, '');

/** Hotel details page with the stay pre-filled. */
export const hotelDeepLink = (
  whitelabelUrl: string,
  hotelId: string,
  query: Pick<
    HotelSearchRequest,
    'checkin' | 'checkout' | 'adults' | 'childrenAges' | 'currency'
  >,
): string => {
  const occupancies = Buffer.from(
    JSON.stringify([{ adults: query.adults, children: query.childrenAges }]),
  ).toString('base64');
  const params = new URLSearchParams({
    checkin: query.checkin,
    checkout: query.checkout,
    occupancies,
    currency: query.currency,
  });

  return `${base(whitelabelUrl)}/hotels/${encodeURIComponent(hotelId)}?${params.toString()}`;
};

/**
 * Checkout for one offer id. liteAPI documents `/booking?offerId=` for hotel
 * rates; its flight page format is not documented yet, so flights use the
 * same entry until Nuitée confirms one.
 */
export const offerCheckoutLink = (
  whitelabelUrl: string,
  offerId: string,
): string =>
  `${base(whitelabelUrl)}/booking?${new URLSearchParams({ offerId }).toString()}`;
