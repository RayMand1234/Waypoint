import { err, ok, type Result } from '@waypoint/contracts/common';
import type { z } from 'zod';
import { invalidRequest, type ServiceError } from '../services/errors.ts';

const describeIssue = (error: z.ZodError): string => {
  const issue = error.issues[0];

  if (issue === undefined) return 'Invalid request.';

  const path = issue.path.join('.');

  return path === '' ? issue.message : `${path}: ${issue.message}`;
};

/** Parses request input against its contract schema. Pure: the caller decides how to answer. */
export const parseInput = <Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): Result<z.output<Schema>, ServiceError> => {
  const parsed = schema.safeParse(input);

  return parsed.success
    ? ok(parsed.data)
    : err(invalidRequest(describeIssue(parsed.error)));
};
