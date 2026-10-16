import { z } from 'zod';

const envFields = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4002),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['pretty', 'json']).default('pretty'),

  DATABASE_URL: z.string().min(1),
  DATABASE_SCHEMA: z
    .string()
    .regex(/^[a-z_][a-z0-9_]*$/, 'expected a lower-case Postgres schema name')
    .default('backend'),
  SUPABASE_URL: z.url(),

  LITEAPI_KEY: z.string().min(1),
  /** Google Places (New), for live spot ratings. Optional: without it ratings are hidden. */
  GOOGLE_PLACES_API_KEY: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().min(1).optional(),
  ),
  LITEAPI_BASE_URL: z.url().default('https://api.liteapi.travel/v3.0'),
  LITEAPI_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  /**
   * The liteAPI white-label booking site that offers' deep links open.
   * Required in production; optional elsewhere (an empty value counts as unset).
   */
  LITEAPI_WHITELABEL_URL: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.url().optional(),
  ),
});

const envSchema = envFields.superRefine((env, ctx) => {
  if (
    env.NODE_ENV === 'production' &&
    env.LITEAPI_WHITELABEL_URL === undefined
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['LITEAPI_WHITELABEL_URL'],
      message: 'required in production — booking links would lead nowhere',
    });
  }
});

export type Env = z.infer<typeof envSchema>;

/** What `npm run migrate` needs — no provider keys. */
const dbEnvSchema = envFields.pick({
  LOG_LEVEL: true,
  LOG_FORMAT: true,
  DATABASE_URL: true,
  DATABASE_SCHEMA: true,
});

export type DbEnv = z.infer<typeof dbEnvSchema>;

type Source = Record<string, string | undefined>;

/**
 * A missing or invalid value throws with every problem listed, so the
 * process refuses to start rather than failing on the first request.
 */
const parseWith = <Schema extends z.ZodType<unknown, Record<string, unknown>>>(
  schema: Schema,
  source: Source,
): z.output<Schema> => {
  const parsed = schema.safeParse(source);

  if (parsed.success) return parsed.data;

  const problems = parsed.error.issues
    .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid environment:\n${problems}`);
};

export const parseEnv = (source: Source = process.env): Env =>
  parseWith(envSchema, source);

export const parseDbEnv = (source: Source = process.env): DbEnv =>
  parseWith(dbEnvSchema, source);
