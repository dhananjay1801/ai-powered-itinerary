import { Schema, model, type Document, type Model, type Types } from 'mongoose';

export type ItineraryItemType =
  | 'flight'
  | 'hotel'
  | 'train'
  | 'bus'
  | 'cab'
  | 'activity'
  | 'meal'
  | 'transfer'
  | 'note';

export type ItineraryStatus = 'generating' | 'ready' | 'failed';

export interface ItineraryItem {
  time?: string;
  type: ItineraryItemType;
  title: string;
  location?: string;
  description?: string;
  bookingRef?: string;
}

export interface ItineraryDay {
  date?: string;
  label?: string;
  items: ItineraryItem[];
}

export interface ItineraryDoc extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  bookingIds: Types.ObjectId[];
  title: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  days: ItineraryDay[];
  status: ItineraryStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<ItineraryItem>(
  {
    time: String,
    type: {
      type: String,
      enum: ['flight', 'hotel', 'train', 'bus', 'cab', 'activity', 'meal', 'transfer', 'note'],
      default: 'note',
    },
    title: { type: String, required: true },
    location: String,
    description: String,
    bookingRef: String,
  },
  { _id: false }
);

const daySchema = new Schema<ItineraryDay>(
  {
    date: String,
    label: String,
    items: { type: [itemSchema], default: [] },
  },
  { _id: false }
);

const itinerarySchema = new Schema<ItineraryDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingIds: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
    title: { type: String, required: true },
    destination: String,
    startDate: String,
    endDate: String,
    summary: String,
    days: { type: [daySchema], default: [] },
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed'],
      default: 'generating',
    },
    errorMessage: String,
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string } | undefined)?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

itinerarySchema.index({ userId: 1, createdAt: -1 });

export const Itinerary: Model<ItineraryDoc> = model<ItineraryDoc>('Itinerary', itinerarySchema);
