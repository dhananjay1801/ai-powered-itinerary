import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokens.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface UserPrincipal {
      id: string;
      email: string;
    }
    interface Request {
      user?: UserPrincipal;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or invalid Authorization header'));
  }

  const token = header.slice(7).trim();
  if (!token) return next(ApiError.unauthorized('Missing token'));

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}
