import type { HotelOffer } from '@waypoint/contracts/hotels';
import { useMemo, useState } from 'react';
import { orderStays, type StayMode } from '../utils/stayOrder';

/** The order the stays show in, and which one is picked. */
export const useStayPick = (
  offers: readonly HotelOffer[],
  savedHotelId: string | undefined,
) => {
  const [mode, setMode] = useState<StayMode>('value');
  const [pickedId, setPickedId] = useState(savedHotelId);
  const ordered = useMemo(() => orderStays(offers, mode), [offers, mode]);

  return {
    mode,
    ordered,
    // Until the traveler picks, the best value stay (first from the server) is picked.
    picked: offers.find((offer) => offer.hotel.id === pickedId) ?? offers[0],
    /** A new order picks its first stay, as the design does. */
    changeMode: (next: StayMode) => {
      setMode(next);
      setPickedId(orderStays(offers, next)[0]?.hotel.id);
    },
    pick: setPickedId,
  };
};
