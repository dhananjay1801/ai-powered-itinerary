import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env.js';

export const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const GEMINI_EXTRACTION_MODEL = env.GEMINI_EXTRACTION_MODEL;
export const GEMINI_ITINERARY_MODEL = env.GEMINI_ITINERARY_MODEL;
