import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../lib/httpError.js';

/** Runs when no route matched. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

/** Turns every error into the same JSON shape: { error: { message, details? } }. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, details: err.details } });
    return;
  }

  // Malformed JSON body thrown by express.json()
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { message: 'Invalid JSON in request body' } });
    return;
  }

  // Unknown error: log it, but never leak internals to the client.
  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } });
};
