import { assertNever } from '@waypoint/contracts/common';
import { isApiError } from './apiError';

/** Copy for a failed call, in Waypoint's voice. */
export const errorMessage = (error: unknown): string => {
  if (!isApiError(error)) return 'Something went wrong. Try again.';

  const { details } = error;

  switch (details.type) {
    case 'unauthorized':
      return 'Your session ended. Sign in again.';
    case 'not-found':
      return "We couldn't find that.";
    case 'network':
      return "We can't reach Waypoint. Check your connection and try again.";
    case 'timeout':
      return 'That took too long. Try again.';
    case 'http':
      return details.status >= 500
        ? 'Something went wrong on our side. Try again.'
        : details.message;
    case 'invalid-response':
      return 'Something went wrong on our side. Try again.';
    default:
      return assertNever(details);
  }
};
