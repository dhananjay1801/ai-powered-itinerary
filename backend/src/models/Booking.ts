import { Schema, model, type Document, type Model, type Types } from 'mongoose';

export type BookingType = 'flight' | 'hotel' | 'train' | 'bus' | 'cab' | 'activity' | 'other';
export type BookingStatus = 'uploaded' | 'parsing' | 'parsed' | 'failed';

export interface ExtractedBookingData {
  type: BookingType;
  title?: string;
  provider?: string;
  bookingReference?: string;
  passengerNames?: string[];
  origin?: string;
  destination?: string;
  startDateTime?: string;
  endDateTime?: string;
  location?: string;
  address?: string;
  notes?: string;
  totalAmount?: string;
  currency?: string;
  raw?: Record<string, unknown>;
}

export interface BookingDoc extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  originalName: string;
  s3Key: string;
  s3Url: string;
  mimeType: string;
  sizeBytes: number;
  status: BookingStatus;
  extractedData?: ExtractedBookingData;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const extractedDataSchema = new Schema<ExtractedBookingData>(
  {
    type: {
      type: String,
      enum: ['flight', 'hotel', 'train', 'bus', 'cab', 'activity', 'other'],
      default: 'other',
    },
    title: String,
    provider: String,
    bookingReference: String,
    passengerNames: [String],
    origin: String,
    destination: String,
    startDateTime: String,
    endDateTime: String,
    location: String,
    address: String,
    notes: String,
    totalAmount: String,
    currency: String,
    raw: Schema.Types.Mixed,
  },
  { _id: false }
);

const bookingSchema = new Schema<BookingDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalName: { type: String, required: true },
    s3Key: { type: String, required: true },
    s3Url: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    status: {
      type: String,
      enum: ['uploaded', 'parsing', 'parsed', 'failed'],
      default: 'uploaded',
    },
    extractedData: extractedDataSchema,
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

bookingSchema.index({ userId: 1, createdAt: -1 });

export const Booking: Model<BookingDoc> = model<BookingDoc>('Booking', bookingSchema);
