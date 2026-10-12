import type { z } from 'zod'

/**
 * Parses a service's environment at startup. A missing or invalid value throws,
 * so the service refuses to start rather than failing on the first request.
 * Constrained to a schema whose input side is an env-like record, so a schema
 * that could never accept `process.env` is a compile error, not a startup one.
 */
export const parseEnv = <Schema extends z.ZodType<unknown, Record<string, unknown>>>(
  schema: Schema,
  source: Record<string, string | undefined> = process.env,
): z.output<Schema> => {
  const parsed = schema.safeParse(source)
  if (parsed.success) return parsed.data

  const problems = parsed.error.issues
    .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
  throw new Error(`Invalid environment:\n${problems}`)
}
