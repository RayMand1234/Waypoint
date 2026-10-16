/**
 * Branded so only `requireUser` can produce one: `toUserId` — the one cast —
 * is called there and nowhere else, so a handler can never turn a body or
 * query value into a `UserId`.
 */
export type UserId = string & { readonly __brand: 'UserId' };

export const toUserId = (sub: string): UserId => sub as UserId;
