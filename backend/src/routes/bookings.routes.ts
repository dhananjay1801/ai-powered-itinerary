import { Router } from 'express';
import {
  deleteBooking,
  listBookings,
  uploadBookings,
} from '../controllers/bookings.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiters.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

bookingsRouter.get('/', asyncHandler(listBookings));
bookingsRouter.post(
  '/upload',
  uploadLimiter,
  uploadMiddleware.array('files'),
  asyncHandler(uploadBookings)
);
bookingsRouter.delete('/:id', asyncHandler(deleteBooking));
