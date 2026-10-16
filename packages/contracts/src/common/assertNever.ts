/**
 * Ends every `switch` over a discriminated union. If a new member is added and
 * a switch forgets it, the call stops compiling — and if it somehow happens at
 * runtime, that is a broken invariant, so it throws.
 */
export const assertNever = (value: never): never => {
  throw new Error(`Unhandled union member: ${JSON.stringify(value)}`);
};
