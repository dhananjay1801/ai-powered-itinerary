import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';

async function bootstrap(): Promise<void> {
  await connectDB();
  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`API server listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
