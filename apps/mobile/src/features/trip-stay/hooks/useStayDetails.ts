import type { HotelOffer } from '@waypoint/contracts/hotels';
import { useState } from 'react';
import { stayPhotos } from '../utils/stayCardModel';
import { useHotel } from './useHotel';

/** Which stay's details sheet is open, with its hotel details once loaded. */
export const useStayDetails = (offers: readonly HotelOffer[]) => {
  const [openId, setOpenId] = useState<string | undefined>(undefined);
  const offer = offers.find((candidate) => candidate.hotel.id === openId);
  const hotel = useHotel(offer?.hotel.id);

  return {
    offer,
    detail: hotel.data,
    photos: offer === undefined ? [] : stayPhotos(offer, hotel.data),
    open: setOpenId,
    close: () => {
      setOpenId(undefined);
    },
  };
};
