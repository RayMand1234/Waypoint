import { isAuthError } from '@supabase/supabase-js';

const GENERIC = "We couldn't sign you in. Try again.";
const UNREACHABLE = "We can't reach sign-in right now. Try again.";

/** Supabase Auth error codes the traveler can do something about. */
const BY_CODE: Readonly<Record<string, string>> = {
  otp_expired: 'That code has expired or was already used. Send a new one.',
  over_email_send_rate_limit: 'Too many tries. Wait a minute, then try again.',
  over_request_rate_limit: 'Too many tries. Wait a minute, then try again.',
  email_address_invalid: 'Check the email address.',
};

/** Copy for a failed sign-in, in Waypoint's voice. */
export const authErrorMessage = (error: unknown): string => {
  if (!isAuthError(error)) return GENERIC;

  const known = error.code === undefined ? undefined : BY_CODE[error.code];

  if (known !== undefined) return known;

  return error.status === undefined || error.status >= 500
    ? UNREACHABLE
    : GENERIC;
};
