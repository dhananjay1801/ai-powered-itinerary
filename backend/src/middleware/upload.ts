import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: env.MAX_FILES_PER_UPLOAD,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});
