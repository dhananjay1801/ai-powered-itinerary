import type { Request, Response } from 'express';
import { z } from 'zod';
import { getUserById, loginUser, registerUser } from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export async function register(req: Request, res: Response): Promise<void> {
  const result = await registerUser(req.body as z.infer<typeof registerSchema>);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await loginUser(req.body as z.infer<typeof loginSchema>);
  res.json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const user = await getUserById(req.user.id);
  res.json({ user });
}
