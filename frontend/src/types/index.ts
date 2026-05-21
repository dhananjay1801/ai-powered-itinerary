export type BookingType =
  | 'flight'
  | 'hotel'
  | 'train'
  | 'bus'
  | 'cab'
  | 'activity'
  | 'other';

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
}

export interface Booking {
  id: string;
  userId: string;
  originalName: string;
  s3Key: string;
  s3Url: string;
  mimeType: string;
  sizeBytes: number;
  status: BookingStatus;
  extractedData?: ExtractedBookingData;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface Itinerary {
  id: string;
  userId: string;
  bookingIds: string[];
  title: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  days: ItineraryDay[];
  status: 'generating' | 'ready' | 'failed';
  createdAt: string;
  updatedAt: string;
}
