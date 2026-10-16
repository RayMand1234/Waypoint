import type {
  FlightOffer,
  FlightSearchRequest,
} from '@waypoint/contracts/flights';
import type { TripDetail } from '@waypoint/contracts/trips';
import { useState } from 'react';
import {
  selectionOf,
  useSaveSelection,
  useStepNavigation,
} from '@/features/trip-flow';
import { errorMessage } from '@/shared/utils/errorMessage';
import { flightResultsState } from '../utils/flightResults';
import { chosenFlightId } from '../utils/flightSelection';
import { useFlightPick } from './useFlightPick';
import { useFlightSearch } from './useFlightSearch';

/** Step 5: wires the fare search, the filters and pick, the details sheet and saving together. */
export const useFlightsStep = (
  trip: TripDetail,
  request: FlightSearchRequest | undefined,
  missingMessage: string,
) => {
  const search = useFlightSearch(request);
  const pick = useFlightPick(search.offers, chosenFlightId(trip));
  const [detailsId, setDetailsId] = useState<string | undefined>(undefined);
  const save = useSaveSelection(trip.id, 'flight');
  const navigation = useStepNavigation(trip.id);
  const selection =
    pick.picked === undefined ? undefined : selectionOf(pick.picked);

  return {
    results: flightResultsState(search.status, pick.filtered, missingMessage),
    bestValue: search.offers.find(
      (offer: FlightOffer) => offer.value.isBestValue,
    ),
    pick,
    details: search.offers.find((offer) => offer.id === detailsId),
    openDetails: setDetailsId,
    closeDetails: () => {
      setDetailsId(undefined);
    },
    navigation,
    retry: search.retry,
    isSaving: save.isPending,
    saveError: save.error === null ? undefined : errorMessage(save.error),
    /** Only a fare with a site to book on can be chosen. */
    canChoose: selection !== undefined,
    choose: () => {
      if (selection === undefined) return;

      save.mutate(selection, {
        onSuccess: () => {
          navigation.finish('flights');
        },
      });
    },
  };
};
