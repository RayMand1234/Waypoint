import { z } from 'zod';

/** Empty strings in `.env.local` mean "not set". */
const optional = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  supabaseUrl: z.url(),
  supabasePublishableKey: z.string().min(1),
  apiUrl: z.url(),
  googleWebClientId: optional,
  googleIosClientId: optional,
  appleSignIn: z.preprocess((value) => value === 'enabled', z.boolean()),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Expo inlines `process.env.EXPO_PUBLIC_*` at build time, so each one is read
 * by its full name here — never through a dynamic key.
 */
export const parseEnv = (): Env => {
  const parsed = envSchema.safeParse({
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    appleSignIn: process.env.EXPO_PUBLIC_APPLE_SIGN_IN,
  });

  if (parsed.success) return parsed.data;

  const problems = parsed.error.issues
    .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(
    `Invalid app environment (see apps/mobile/.env.example):\n${problems}`,
  );
};

export const env: Env = parseEnv();
