import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { bookingsRouter } from './routes/bookings.routes.js';
import { itinerariesRouter } from './routes/itineraries.routes.js';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/itineraries', itinerariesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
