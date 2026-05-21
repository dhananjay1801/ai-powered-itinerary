import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

mongoose.set('strictQuery', true);

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
    });
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error({ err }, 'MongoDB connection failed');
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
