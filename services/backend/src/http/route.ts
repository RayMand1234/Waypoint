import type { Result } from '@waypoint/contracts/common';
import type { RequestHandler, Response } from 'express';
import { z } from 'zod';
import type { ServiceError } from '../services/errors.ts';
import { sendResult } from './respond.ts';
import { parseInput } from './validate.ts';

/** The response of a 204 route: nothing. */
export const noContentSchema = z.null();

export type RouteOptions = {
  /** 201 for creates; 204 sends no body. */
  readonly successStatus?: 200 | 201 | 204;
};

/**
 * Every controller handler: parse `{ params, query, body }` with one contract
 * schema (a failure is a 400 naming the field, e.g. `body.endDate: …`), call
 * the service, send its result. Handlers only say which response contract,
 * which input schema and which call.
 */
export const route =
  <Output extends z.ZodType, Schema extends z.ZodType>(
    // Ties the handler's result to the route's response contract at compile
    // time; responses are not parsed again at runtime.
    _output: Output,
    input: Schema,
    run: (
      parsed: z.output<Schema>,
      res: Response,
    ) => Promise<Result<z.output<Output>, ServiceError>>,
    { successStatus = 200 }: RouteOptions = {},
  ): RequestHandler =>
  async (req, res) => {
    const parsed = parseInput(input, {
      params: req.params,
      query: req.query,
      body: req.body as unknown,
    });

    if (!parsed.ok) {
      sendResult(res, parsed);

      return;
    }

    const result = await run(parsed.value, res);

    if (result.ok && successStatus === 204) {
      res.status(204).end();

      return;
    }

    sendResult(res, result, successStatus);
  };
