import { zodResolver } from '@hookform/resolvers/zod';
import type { Profile } from '@waypoint/contracts/trips';
import { useForm } from 'react-hook-form';
import { errorMessage } from '@/shared/utils/errorMessage';
import {
  profileFormSchema,
  toFormValues,
  toUpdateRequest,
  type ProfileFormOutput,
  type ProfileFormValues,
} from '../utils/profileFormSchema';
import { useUpdateMe } from './useUpdateMe';

/** Name and home airport, saved together. */
export const useProfileForm = (profile: Profile) => {
  const update = useUpdateMe();
  const form = useForm<ProfileFormValues, unknown, ProfileFormOutput>({
    resolver: zodResolver(profileFormSchema),
    values: toFormValues(profile),
  });

  const submit = form.handleSubmit((values) => {
    update.mutate(toUpdateRequest(values));
  });

  return {
    control: form.control,
    submit,
    isDirty: form.formState.isDirty,
    isSaving: update.isPending,
    wasSaved: update.isSuccess && !form.formState.isDirty,
    error: update.error === null ? undefined : errorMessage(update.error),
  };
};
