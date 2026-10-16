import { zodResolver } from '@hookform/resolvers/zod';
import type { IsoDate } from '@waypoint/contracts/common';
import type { Spot } from '@waypoint/contracts/destinations';
import type { TripDetail } from '@waypoint/contracts/trips';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useStepNavigation, useUpdateTrip } from '@/features/trip-flow';
import { addDays, todayOf, tripDays } from '@/shared/utils/dates';
import { errorMessage } from '@/shared/utils/errorMessage';
import { plural } from '@/shared/utils/text';
import { fitLabel, fitsIn, suggestedSpotIds } from '../utils/spotFit';
import { toggleId } from '../utils/spotRowModel';
import {
  spotsFormSchema,
  type SpotsFormValues,
} from '../utils/spotsFormSchema';

/** A new trip starts a month out and lasts five days, until the traveler picks dates. */
const DEFAULT_LEAD_DAYS = 30;
const DEFAULT_LENGTH = 5;

const defaultsFor = (
  trip: TripDetail,
  spots: readonly Spot[],
  today: IsoDate,
): SpotsFormValues => {
  const startDate = trip.startDate ?? addDays(today, DEFAULT_LEAD_DAYS);
  const endDate = trip.endDate ?? addDays(startDate, DEFAULT_LENGTH - 1);
  const known = new Set(spots.map((spot) => spot.id));
  const saved = trip.spots
    .map((spot) => spot.spotId)
    .filter((id) => known.has(id));

  return {
    startDate,
    endDate,
    adults: trip.adults,
    childrenAges: [...trip.childrenAges],
    spotIds:
      saved.length > 0
        ? saved
        : suggestedSpotIds(spots, tripDays(startDate, endDate), trip.pace),
  };
};

/** Step 3: dates, travelers and spots, saved together on Continue, then on to the stay. */
export const useSpotsForm = (trip: TripDetail, spots: readonly Spot[]) => {
  const update = useUpdateTrip(trip.id);
  const navigation = useStepNavigation(trip.id);
  // Read once: the calendar's "today" doesn't need to tick while the step is open.
  const today = useMemo(() => todayOf(new Date()), []);
  const defaultValues = useMemo(
    () => defaultsFor(trip, spots, today),
    [trip, spots, today],
  );
  const form = useForm<SpotsFormValues>({
    resolver: zodResolver(spotsFormSchema(spots.length)),
    defaultValues,
  });
  const [startDate, endDate, adults, childrenAges, spotIds] = useWatch({
    control: form.control,
    name: ['startDate', 'endDate', 'adults', 'childrenAges', 'spotIds'],
  });
  const days = tripDays(startDate, endDate);
  const picked = spots.filter((spot) => spotIds.includes(spot.id));
  const set = form.setValue;

  const submit = form.handleSubmit(({ spotIds: ids, ...values }) => {
    const chosen = spots
      .filter((spot) => ids.includes(spot.id))
      .map((spot) => ({ spotId: spot.id, name: spot.name }));

    update.mutate(
      { ...values, spots: chosen },
      {
        onSuccess: () => {
          navigation.finish('spots');
        },
      },
    );
  });

  return {
    values: { startDate, endDate, adults, childrenAges, spotIds },
    today,
    days,
    caption:
      spots.length === 0
        ? 'Dates and travelers'
        : `${plural(picked.length, 'spot')} selected`,
    fits: fitsIn(picked, days, trip.pace),
    fitLabel: fitLabel(picked, days, trip.pace),
    /** Nothing to save until a spot is picked, when there are spots to pick. */
    canContinue: spots.length === 0 || picked.length > 0,
    setDates: (start: IsoDate, end: IsoDate) => {
      set('startDate', start);
      set('endDate', end);
    },
    setTravelers: (nextAdults: number, ages: number[]) => {
      set('adults', nextAdults);
      set('childrenAges', ages);
    },
    setLength: (length: number) => {
      set('endDate', addDays(startDate, length - 1));
    },
    toggleSpot: (spotId: string) => {
      set('spotIds', toggleId(spotIds, spotId));
    },
    submit,
    navigation,
    isSaving: update.isPending,
    error: update.error === null ? undefined : errorMessage(update.error),
  };
};
