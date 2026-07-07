import { z } from 'zod';
import { GEMINI_EXTRACTION_MODEL, genAI } from '../config/gemini.js';
import type { ExtractedBookingData } from '../models/Booking.js';
import { logger } from '../utils/logger.js';

const extractionSchema = z.object({
  type: z
    .enum(['flight', 'hotel', 'train', 'bus', 'cab', 'activity', 'other'])
    .default('other'),
  documentKind: z.enum(['single-booking', 'multi-item-itinerary']).optional(),
  title: z.string().optional(),
  provider: z.string().optional(),
  bookingReference: z.string().optional(),
  passengerNames: z.array(z.string()).optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  startDateTime: z.string().optional(),
  endDateTime: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  totalAmount: z.string().optional(),
  currency: z.string().optional(),
  // Every timestamped line in the source document, one entry per line.
  // Deliberately uncapped: a detailed itinerary can have dozens of entries.
  lineItems: z
    .array(
      z.object({
        date: z.string().optional(),
        time: z.string().optional(),
        title: z.string().min(1),
        location: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
});

const EXTRACTION_INSTRUCTIONS = `You are an expert travel-document parser. Given a single travel document
(a flight ticket, hotel reservation, train ticket, bus ticket, cab confirmation, activity voucher,
or a detailed day-by-day itinerary), extract its contents and return STRICT JSON only - no prose,
no markdown fences.

CRITICAL - GRANULARITY:
- You are a PARSER, not a summarizer. Never condense, merge, or paraphrase entries.
- If the document contains a schedule, agenda, or itinerary with multiple dated/timed lines
  (e.g. "06:00 Wake up", "08:45 Amber Fort guided tour"), you MUST output EVERY such line
  as its own object in "lineItems", preserving its exact time, title, and location.
- A document with 30 timestamped lines must produce 30 lineItems. There is no maximum length.
- Set "documentKind" to "multi-item-itinerary" for such documents, otherwise "single-booking".
- For a simple single booking (one flight, one hotel stay), "lineItems" may be omitted.

Use this schema (omit a field if you cannot find it; do not invent values):
{
  "type": "flight" | "hotel" | "train" | "bus" | "cab" | "activity" | "other",
  "documentKind": "single-booking" | "multi-item-itinerary",
  "title": "Short human readable title (e.g. 'AI 803 Delhi to Mumbai' or 'Taj Palace, Mumbai')",
  "provider": "Airline / hotel chain / operator name",
  "bookingReference": "PNR / confirmation number",
  "passengerNames": ["Full name 1", "Full name 2"],
  "origin": "City or airport for transport bookings",
  "destination": "City or airport / hotel city",
  "startDateTime": "ISO 8601 if possible, e.g. 2025-06-12T09:30 or 2025-06-12",
  "endDateTime": "ISO 8601 for return / checkout, if applicable",
  "location": "Hotel / activity location",
  "address": "Full address if available",
  "notes": "Any other useful info (seat, room type, baggage)",
  "totalAmount": "Numeric string only",
  "currency": "ISO currency code (INR, USD, EUR...)",
  "lineItems": [
    {
      "date": "YYYY-MM-DD if stated or inferable from day headers",
      "time": "HH:mm as written in the document",
      "title": "The activity/event exactly as described (e.g. 'Amber Fort guided tour')",
      "location": "Place name if present on that line",
      "description": "Any extra detail on that line"
    }
  ]
}

Return JSON only.`;

function stripCodeFences(text: string): string {
  return text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function parseJsonLoose(text: string): unknown {
  const cleaned = stripCodeFences(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('AI response was not valid JSON');
  }
}

export async function extractBookingData(params: {
  buffer: Buffer;
  mimeType: string;
}): Promise<{ data: ExtractedBookingData; raw: string }> {
  const model = genAI.getGenerativeModel({
    model: GEMINI_EXTRACTION_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const result = await model.generateContent([
    { text: EXTRACTION_INSTRUCTIONS },
    {
      inlineData: {
        mimeType: params.mimeType,
        data: params.buffer.toString('base64'),
      },
    },
  ]);

  const raw = result.response.text();
  let parsed: unknown;
  try {
    parsed = parseJsonLoose(raw);
  } catch (err) {
    logger.warn({ err, rawSnippet: raw.slice(0, 200) }, 'Failed to parse extraction JSON');
    return {
      data: { type: 'other', notes: 'Could not parse document automatically.' },
      raw,
    };
  }

  const validated = extractionSchema.safeParse(parsed);
  if (!validated.success) {
    logger.warn(
      { errors: validated.error.flatten() },
      'Extraction JSON did not match schema; storing raw'
    );
    return {
      data: { type: 'other', raw: parsed as Record<string, unknown> },
      raw,
    };
  }

  return { data: validated.data as ExtractedBookingData, raw };
}
