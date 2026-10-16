import { z } from 'zod';

/**
 * One id per provider adapter folder in `services/backend/src/providers/`.
 * liteAPI supplies offers; Google supplies live spot ratings only.
 */
export const providerIdSchema = z.enum(['liteapi', 'google']);
export type ProviderId = z.infer<typeof providerIdSchema>;
