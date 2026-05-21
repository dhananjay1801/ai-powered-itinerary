import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
