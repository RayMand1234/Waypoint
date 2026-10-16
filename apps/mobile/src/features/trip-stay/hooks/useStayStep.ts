import type { HotelSearchRequest } from '@waypoint/contracts/hotels';
import type { TripDetail } from '@waypoint/contracts/trips';
import { useMemo } from 'react';
import { useStepNavigation } from '@/features/trip-flow';
import { errorMessage } from '@/shared/utils/errorMessage';
import { stayHighlights } from '../utils/stayCardModel';
import { stayResultsState } from '../utils/stayResults';
import { chosenHotelId, staySelection } from '../utils/staySelection';
import { useSaveStay } from './useSaveStay';
import { useStayDetails } from './useStayDetails';
import { useStayPick } from './useStayPick';
import { useStaySearch } from './useStaySearch';

/** Step 4: wires the search, the pick, the details sheet and saving together. */
export const useStayStep = (
  trip: TripDetail,
  request: HotelSearchRequest | undefined,
) => {
  const search = useStaySearch(request);
  const pick = useStayPick(search.offers, chosenHotelId(trip));
  const details = useStayDetails(search.offers);
  const save = useSaveStay(trip.id);
  const navigation = useStepNavigation(trip.id);
  const highlights = useMemo(
    () => stayHighlights(search.offers),
    [search.offers],
  );
  const selection =
    pick.picked === undefined ? undefined : staySelection(pick.picked);

  return {
    results: stayResultsState(search.status, pick.ordered, highlights),
    highlights,
    pick,
    details,
    navigation,
    retry: search.retry,
    isSaving: save.isPending,
    saveError: save.error === null ? undefined : errorMessage(save.error),
    /** Only a stay with a site to book on can be chosen. */
    canChoose: selection !== undefined,
    choose: () => {
      if (selection === undefined) return;

      save.mutate(selection, {
        onSuccess: () => {
          navigation.finish('stay');
        },
      });
    },
  };
};
