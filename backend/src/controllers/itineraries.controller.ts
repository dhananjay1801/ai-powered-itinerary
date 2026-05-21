import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { Booking } from '../models/Booking.js';
import { Itinerary } from '../models/Itinerary.js';
import { generateItinerary } from '../services/itinerary.service.js';
import { streamItineraryPdf } from '../services/pdf.service.js';
import { ApiError } from '../utils/ApiError.js';

export const createItinerarySchema = z.object({
  bookingIds: z.array(z.string()).min(1, 'Pick at least one booking'),
  title: z.string().min(1).max(120).optional(),
});

export async function createItinerary(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const { bookingIds, title } = req.body as z.infer<typeof createItinerarySchema>;

  const validIds = bookingIds.filter((id) => isValidObjectId(id));
  if (validIds.length !== bookingIds.length) {
    throw ApiError.badRequest('One or more booking ids are invalid');
  }

  const bookings = await Booking.find({
    _id: { $in: validIds },
    userId: req.user.id,
  });

  if (bookings.length !== validIds.length) {
    throw ApiError.notFound('Some bookings were not found.');
  }

  const usable = bookings.filter((b) => b.status === 'parsed' && b.extractedData);
  if (usable.length === 0) {
    throw ApiError.badRequest(
      'None of the selected bookings have been parsed yet. Wait for extraction or re-upload.'
    );
  }

  let ai;
  try {
    ai = await generateItinerary({ bookings: usable, userProvidedTitle: title });
  } catch (err) {
    throw ApiError.internal(
      err instanceof Error ? err.message : 'Failed to generate itinerary'
    );
  }

  const itinerary = await Itinerary.create({
    userId: req.user.id,
    bookingIds: usable.map((b) => b._id),
    title: ai.title,
    destination: ai.destination,
    startDate: ai.startDate,
    endDate: ai.endDate,
    summary: ai.summary,
    days: ai.days,
    status: 'ready',
  });

  res.status(201).json({ itinerary: itinerary.toJSON() });
}

export async function listItineraries(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const itineraries = await Itinerary.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ itineraries: itineraries.map((i) => i.toJSON()) });
}

export async function getItinerary(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params;
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid id');

  const itinerary = await Itinerary.findOne({ _id: id, userId: req.user.id });
  if (!itinerary) throw ApiError.notFound('Itinerary not found');

  res.json({ itinerary: itinerary.toJSON() });
}

export async function deleteItinerary(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params;
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid id');

  const result = await Itinerary.deleteOne({ _id: id, userId: req.user.id });
  if (result.deletedCount === 0) throw ApiError.notFound('Itinerary not found');

  res.status(204).send();
}

export async function downloadItineraryPdf(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params;
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid id');

  const itinerary = await Itinerary.findOne({ _id: id, userId: req.user.id });
  if (!itinerary) throw ApiError.notFound('Itinerary not found');

  streamItineraryPdf(res, itinerary);
}
