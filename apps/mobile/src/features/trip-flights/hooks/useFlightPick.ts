import type { FlightOffer } from '@waypoint/contracts/flights';
import { useMemo, useState } from 'react';
import {
  filterFlights,
  toggleFilter,
  type FlightFilter,
} from '../utils/flightFilters';

/** Which filters are on, the fares they leave, and which fare is picked. */
export const useFlightPick = (
  offers: readonly FlightOffer[],
  savedFlightId: string | undefined,
) => {
  const [filters, setFilters] = useState<readonly FlightFilter[]>([]);
  const [pickedId, setPickedId] = useState(savedFlightId);
  const filtered = useMemo(
    () => filterFlights(offers, filters),
    [offers, filters],
  );

  return {
    filters,
    filtered,
    // Until the traveler picks, the best value fare (first from the server) is picked.
    picked: offers.find((offer) => offer.id === pickedId) ?? offers[0],
    toggle: (filter: FlightFilter) => {
      setFilters(toggleFilter(filters, filter));
    },
    clearFilters: () => {
      setFilters([]);
    },
    pick: setPickedId,
  };
};
