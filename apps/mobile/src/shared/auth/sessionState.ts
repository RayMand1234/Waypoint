import type { Session } from '@supabase/supabase-js';

/** Auth-client state (not server data), so it lives in context, not React Query. */
export type SessionState =
  | { readonly status: 'loading' }
  | { readonly status: 'signed-out' }
  | { readonly status: 'signed-in'; readonly session: Session };

export const toSessionState = (session: Session | null): SessionState =>
  session === null
    ? { status: 'signed-out' }
    : { status: 'signed-in', session };
