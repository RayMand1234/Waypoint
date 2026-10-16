import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/shared/utils/queryKeys';
import { fetchMe } from './meApi';

/** The signed-in traveler's profile — one definition for the hook and for prefetching. */
export const meQuery = queryOptions({
  queryKey: queryKeys.me,
  queryFn: fetchMe,
});
