import { z } from 'zod';
import { GEMINI_ITINERARY_MODEL, genAI } from '../config/gemini.js';
import type { BookingDoc } from '../models/Booking.js';
import { logger } from '../utils/logger.js';

const itinerarySchema = z.object({
  title: z.string().min(1),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  summary: z.string().optional(),
  days: z
    .array(
      z.object({
        date: z.string().optional(),
        label: z.string().optional(),
        items: z
          .array(
            z.object({
              time: z.string().optional(),
              type: z
                .enum([
                  'flight',
                  'hotel',
                  'train',
                  'bus',
                  'cab',
                  'activity',
                  'meal',
                  'transfer',
                  'note',
                ])
                .default('note'),
              title: z.string().min(1),
              location: z.string().optional(),
              description: z.string().optional(),
              bookingRef: z.string().optional(),
            })
          )
          .default([]),
      })
    )
    .min(1, 'AI returned no days'),
});

export type AiItinerary = z.infer<typeof itinerarySchema>;

const ITINERARY_INSTRUCTIONS = `You are a travel itinerary assembler. Given the user's travel documents (flights, hotels,
trains, activities, and detailed day-by-day itineraries), merge them into one chronological, day-by-day
itinerary. Use the source data verbatim (don't invent flight numbers, hotel names, or PNRs).

CRITICAL - PRESERVE GRANULARITY:
- Do not paraphrase multiple distinct activities into a single summary activity. Preserve each
  activity as its own entry with its own timestamp.
- Every entry in every document's "lineItems" array MUST appear as its own item in the output,
  with its original time. NEVER collapse them into a generic block like "Jaipur Sightseeing".
- The output for a given day must contain AT LEAST as many items as the most detailed source
  document lists for that day. If one document has 10 timed entries for a day, output at least 10.
- The ONLY merging allowed is deduplication: when two documents describe the SAME real-world
  event (e.g. the same train appears in both a ticket and a detailed itinerary), output it ONCE,
  combining facts from both (take the PNR from the ticket, the timing detail from the itinerary).
  Two different activities are NEVER the "same event" - keep them separate.
- There is no limit on the number of items per day. Long output is correct output.

Rules:
- Group items into days based on start date/time. Each day must list items in chronological order.
- Use "date" in YYYY-MM-DD when known. If not known, omit it and use a friendly "label" like "Day 1".
- For flights, include origin/destination, time, and flight number in title (e.g. "Flight AI 803 - DEL to BOM").
- For hotels, create a check-in item on the start date and a check-out item on the end date.
- CARRY BOOKING DETAILS INTO EACH ITEM: put the PNR/confirmation number in "bookingRef", and put
  all other useful facts from the source booking in "description" - e.g. for a flight/train/bus:
  provider, coach/seat/berth, passenger names, departure and arrival stations with times; for a
  hotel: provider/chain, room type, full address, check-in/check-out times, guest names; for an
  activity: operator, meeting point, duration. Do not silently drop these facts - if a detail
  exists in the source data (including totalAmount and currency), surface it in the relevant item.
- OMIT EMPTY FIELDS - DO NOT WRITE FILLER: if a field has no real value in the source data, leave
  it out entirely. Never emit placeholder or restating text such as "No specific booking details
  provided in documents", "No details available", "N/A", or a "description" that merely repeats the
  title/type like "Activity for Rahul Sharma". Only include "description" when it adds real,
  concrete information beyond the title; otherwise omit it. Same for "bookingRef", "location", and "time".
- Add light, helpful suggestions ONLY as "note" items (e.g. "Reach airport 2 hours early") - keep them brief and clearly optional.
- Do NOT fabricate prices, addresses, or confirmation numbers that aren't in the input.
- Before returning, verify: count the timed entries per day in the most detailed source document
  and confirm your output for that day has at least that many items. If not, add the missing ones.

Return STRICT JSON only matching this schema:
{
  "title": "Short trip title, e.g. 'Mumbai - Goa Getaway'",
  "destination": "Primary destination city/country",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "summary": "1-2 sentence overview",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "label": "Day 1",
      "items": [
        {
          "time": "HH:mm",
          "type": "flight | hotel | train | bus | cab | activity | meal | transfer | note",
          "title": "Short, descriptive",
          "location": "Optional",
          "description": "OPTIONAL - only real booking details (provider, seat/coach, room type, address, amounts). Omit entirely if there is nothing concrete to add; never write filler like 'No details available'.",
          "bookingRef": "OPTIONAL - PNR / confirmation number when the source booking has one; omit otherwise"
        }
      ]
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
    if (match) return JSON.parse(match[0]);
    throw new Error('AI response was not valid JSON');
  }
}

function buildBookingContext(bookings: BookingDoc[]): string {
  return JSON.stringify(
    bookings.map((b) => ({
      id: b._id.toString(),
      originalName: b.originalName,
      type: b.extractedData?.type ?? 'other',
      data: b.extractedData ?? null,
    })),
    null,
    2
  );
}

export async function generateItinerary(params: {
  bookings: BookingDoc[];
  userProvidedTitle?: string;
}): Promise<AiItinerary> {
  if (params.bookings.length === 0) {
    throw new Error('At least one booking is required to build an itinerary');
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_ITINERARY_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  });

  const context = buildBookingContext(params.bookings);
  const titleHint = params.userProvidedTitle
    ? `The user suggested the title: "${params.userProvidedTitle}". Use it if it makes sense, otherwise pick a better one.`
    : '';

  const result = await model.generateContent([
    { text: ITINERARY_INSTRUCTIONS },
    { text: titleHint },
    { text: `Bookings JSON:\n${context}` },
  ]);

  const raw = result.response.text();
  let parsed: unknown;
  try {
    parsed = parseJsonLoose(raw);
  } catch (err) {
    logger.error({ err, rawSnippet: raw.slice(0, 300) }, 'Itinerary JSON parse failed');
    throw new Error('AI returned an unparseable itinerary. Please try again.');
  }

  const validated = itinerarySchema.safeParse(parsed);
  if (!validated.success) {
    logger.error(
      { errors: validated.error.flatten(), rawSnippet: raw.slice(0, 300) },
      'Itinerary schema validation failed'
    );
    throw new Error('AI returned an itinerary in an unexpected format.');
  }

  return validated.data;
}
