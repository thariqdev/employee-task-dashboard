import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { HttpError } from '../lib/httpError.js';

type Source = 'body' | 'query' | 'params';

/**
 * Validates part of the request against a zod schema.
 * The parsed (cleaned and typed) value replaces req.body, or is stored in
 * res.locals.query / res.locals.params, because Express 5 makes req.query read-only.
 */
export function validate(schema: ZodType, source: Source = 'body'): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new HttpError(400, 'Validation failed', details));
    }

    if (source === 'body') {
      req.body = result.data;
    } else {
      res.locals[source] = result.data;
    }
    next();
  };
}
