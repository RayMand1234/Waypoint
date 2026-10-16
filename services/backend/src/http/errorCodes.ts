import { toHttpErrorCode } from '@waypoint/contracts/common';

/** The error codes this API answers with, named once. */
export const NOT_FOUND = toHttpErrorCode('not-found');
export const UNAUTHORIZED = toHttpErrorCode('unauthorized');
export const INVALID_REQUEST = toHttpErrorCode('invalid-request');
export const CONFLICT = toHttpErrorCode('conflict');
export const UPSTREAM_TIMEOUT = toHttpErrorCode('upstream-timeout');
export const UPSTREAM_UNAVAILABLE = toHttpErrorCode('upstream-unavailable');
export const INTERNAL_ERROR = toHttpErrorCode('internal-error');
