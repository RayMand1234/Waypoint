import { z } from 'zod';

/**
 * A photo we may show, with the credit its licence requires (most are
 * Creative Commons from Wikimedia Commons). `sourceUrl` is the photo's page.
 */
export const photoSchema = z.object({
  url: z.url(),
  author: z.string().nullable(),
  license: z.string().min(1),
  licenseUrl: z.url().nullable(),
  sourceUrl: z.url(),
});
export type Photo = z.infer<typeof photoSchema>;
