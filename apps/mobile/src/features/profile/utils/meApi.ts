import {
  getMeResponseSchema,
  updateMeResponseSchema,
  type Profile,
  type UpdateMeRequest,
} from '@waypoint/contracts/trips';
import { apiRequest } from '@/shared/utils/apiClient';

/** The signed-in traveler's profile; the backend creates it on the first call. */
export const fetchMe = (): Promise<Profile> =>
  apiRequest('/me', getMeResponseSchema);

export const updateMe = (changes: UpdateMeRequest): Promise<Profile> =>
  apiRequest('/me', updateMeResponseSchema, { method: 'PATCH', body: changes });
