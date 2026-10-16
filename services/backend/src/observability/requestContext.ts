import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * What every log line written while serving one request carries, so a single
 * traveler action can be followed through route → controller → service →
 * provider call → database query without passing ids by hand.
 */
export type RequestContext = {
  readonly requestId: string;
  /** Set once `requireUser` has verified the token. */
  readonly userId?: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

/** Runs `fn` (and every async continuation it starts) inside `context`. */
export const runWithContext = <T>(context: RequestContext, fn: () => T): T =>
  storage.run(context, fn);

/** The context of the request being served, or `undefined` outside one. */
export const currentContext = (): RequestContext | undefined =>
  storage.getStore();
