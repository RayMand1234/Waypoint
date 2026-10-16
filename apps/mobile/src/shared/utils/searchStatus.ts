import { errorMessage } from './errorMessage';

/** A live price search, as a list shows it. */
export type SearchStatus<Response> =
  /** The trip isn't ready to search yet (no nights, no airport). */
  | { readonly status: 'no-request' }
  | { readonly status: 'pending' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'success'; readonly response: Response };

export const searchStatusOf = <Response>(
  hasRequest: boolean,
  query: { readonly error: unknown; readonly data: Response | undefined },
): SearchStatus<Response> => {
  if (!hasRequest) return { status: 'no-request' };

  if (query.error !== null && query.error !== undefined)
    return { status: 'error', message: errorMessage(query.error) };

  return query.data === undefined
    ? { status: 'pending' }
    : { status: 'success', response: query.data };
};
