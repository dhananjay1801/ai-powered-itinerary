import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }
    // Assign back to keep typing consistent; safe because we own the route.
    (req as unknown as Record<Source, unknown>)[source] = parsed.data;
    next();
  };
}
