import { Router } from 'express';
import {
  createItinerary,
  createItinerarySchema,
  deleteItinerary,
  downloadItineraryPdf,
  getItinerary,
  listItineraries,
} from '../controllers/itineraries.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const itinerariesRouter = Router();

itinerariesRouter.use(requireAuth);

itinerariesRouter.get('/', asyncHandler(listItineraries));
itinerariesRouter.post('/', validate(createItinerarySchema), asyncHandler(createItinerary));
itinerariesRouter.get('/:id', asyncHandler(getItinerary));
itinerariesRouter.delete('/:id', asyncHandler(deleteItinerary));
itinerariesRouter.get('/:id/pdf', asyncHandler(downloadItineraryPdf));
