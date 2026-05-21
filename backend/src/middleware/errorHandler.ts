import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  const e = err as { code?: string; message?: string; name?: string };

  if (e?.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'One of the files is too large.' },
    });
    return;
  }

  if (e?.name === 'MongoServerError' && (err as { code?: number }).code === 11000) {
    res.status(409).json({
      error: { code: 'CONFLICT', message: 'A resource with that value already exists.' },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
  });
}
