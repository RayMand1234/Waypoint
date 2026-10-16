/** Why a backend call failed. Expected, so typed — the UI picks copy from `type`. */
export type ApiErrorDetails =
  | { readonly type: 'unauthorized' }
  | { readonly type: 'not-found'; readonly message: string }
  | {
      readonly type: 'http';
      readonly status: number;
      readonly code: string;
      readonly message: string;
    }
  | { readonly type: 'network'; readonly message: string }
  | { readonly type: 'timeout' }
  | { readonly type: 'invalid-response'; readonly message: string };

/**
 * React Query surfaces failures as thrown errors, so a failed call throws an
 * `Error` carrying its typed details — never a bare string or object.
 */
export type ApiError = Error & { readonly details: ApiErrorDetails };

export const apiError = (details: ApiErrorDetails): ApiError =>
  Object.assign(new Error(`api ${details.type}`), { details });

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof Error &&
  'details' in error &&
  typeof error.details === 'object' &&
  error.details !== null;
