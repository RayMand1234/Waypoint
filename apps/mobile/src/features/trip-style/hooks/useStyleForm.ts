import { zodResolver } from '@hookform/resolvers/zod';
import type { TripDetail } from '@waypoint/contracts/trips';
import { useForm } from 'react-hook-form';
import { useStepNavigation, useUpdateTrip } from '@/features/trip-flow';
import { errorMessage } from '@/shared/utils/errorMessage';
import {
  styleFormSchema,
  type StyleFormValues,
} from '../utils/styleFormSchema';

/** Step 1: the trip's styles and pace, saved on Continue, then on to Destination. */
export const useStyleForm = (trip: TripDetail) => {
  const update = useUpdateTrip(trip.id);
  const navigation = useStepNavigation(trip.id);
  const form = useForm<StyleFormValues>({
    resolver: zodResolver(styleFormSchema),
    defaultValues: { styles: trip.styles, pace: trip.pace },
  });

  const submit = form.handleSubmit((values) => {
    update.mutate(values, {
      onSuccess: () => {
        navigation.finish('style');
      },
    });
  });

  return {
    control: form.control,
    submit,
    navigation,
    isSaving: update.isPending,
    error: update.error === null ? undefined : errorMessage(update.error),
  };
};
