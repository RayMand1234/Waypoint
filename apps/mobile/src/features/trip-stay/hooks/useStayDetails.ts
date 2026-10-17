import type { HotelOffer } from '@waypoint/contracts/hotels';
import { useState } from 'react';
import { stayPhotos } from '../utils/stayCardModel';
import { useHotel } from './useHotel';
import { useHotelReviews } from './useHotelReviews';

/** Which stay's details sheet is open, with its hotel details once loaded. */
export const useStayDetails = (offers: readonly HotelOffer[]) => {
  const [openId, setOpenId] = useState<string | undefined>(undefined);
  const offer = offers.find((candidate) => candidate.hotel.id === openId);
  const hotel = useHotel(offer?.hotel.id);
  const reviews = useHotelReviews(offer?.hotel.id);

  return {
    offer,
    detail: hotel.data,
    reviews: reviews.data,
    photos: offer === undefined ? [] : stayPhotos(offer, hotel.data),
    open: setOpenId,
    close: () => {
      setOpenId(undefined);
    },
  };
};
