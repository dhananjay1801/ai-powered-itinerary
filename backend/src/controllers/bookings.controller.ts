import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Booking } from '../models/Booking.js';
import { extractBookingData } from '../services/extraction.service.js';
import { deleteFile, uploadFile } from '../services/storage.service.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export async function uploadBookings(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    throw ApiError.badRequest('Please attach at least one file.');
  }

  const results = await Promise.all(
    files.map(async (file) => {
      const userId = req.user!.id;

      const uploaded = await uploadFile({
        buffer: file.buffer,
        mimeType: file.mimetype,
        originalName: file.originalname,
        userId,
      });

      const booking = await Booking.create({
        userId,
        originalName: file.originalname,
        s3Key: uploaded.key,
        s3Url: uploaded.url,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        status: 'parsing',
      });

      try {
        const { data } = await extractBookingData({
          buffer: file.buffer,
          mimeType: file.mimetype,
        });
        booking.extractedData = data;
        booking.status = 'parsed';
        await booking.save();
      } catch (err) {
        logger.error({ err, bookingId: booking._id.toString() }, 'Extraction failed');
        booking.status = 'failed';
        booking.errorMessage =
          err instanceof Error ? err.message : 'Extraction failed unexpectedly.';
        await booking.save();
      }

      return booking.toJSON();
    })
  );

  res.status(201).json({ bookings: results });
}

export async function listBookings(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const bookings = await Booking.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ bookings: bookings.map((b) => b.toJSON()) });
}

export async function deleteBooking(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = req.params;
  if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid booking id');

  const booking = await Booking.findOne({ _id: id, userId: req.user.id });
  if (!booking) throw ApiError.notFound('Booking not found');

  await deleteFile(booking.s3Key);
  await booking.deleteOne();

  res.status(204).send();
}
