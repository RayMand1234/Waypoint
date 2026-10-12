import { toHttpErrorCode } from '@waypoint/contracts/common'

/**
 * The handful of error codes server-kit itself returns, named once so
 * `'unauthorized'` (used by two different guards) can't drift into
 * `'un-authorized'` in one of them, and validated through the branded
 * `HttpErrorCode` type rather than passed around as bare strings.
 */
export const NOT_FOUND = toHttpErrorCode('not-found')
export const UNAUTHORIZED = toHttpErrorCode('unauthorized')
export const INTERNAL_ERROR = toHttpErrorCode('internal-error')
