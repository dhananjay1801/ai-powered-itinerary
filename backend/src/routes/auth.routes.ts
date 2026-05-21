import { Router } from 'express';
import { login, loginSchema, me, register, registerSchema } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), asyncHandler(register));
authRouter.post('/login', authLimiter, validate(loginSchema), asyncHandler(login));
authRouter.get('/me', requireAuth, asyncHandler(me));
