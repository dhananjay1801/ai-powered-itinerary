import {
  Plane,
  BedDouble,
  Train,
  Bus,
  Car,
  Camera,
  Utensils,
  ArrowRightLeft,
  StickyNote,
  FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  flight: Plane,
  hotel: BedDouble,
  train: Train,
  bus: Bus,
  cab: Car,
  activity: Camera,
  meal: Utensils,
  transfer: ArrowRightLeft,
  note: StickyNote,
  other: FileText,
};

export function BookingTypeIcon({
  type,
  className = 'h-4 w-4',
}: {
  type?: string;
  className?: string;
}) {
  const Icon = (type && ICONS[type]) || FileText;
  return <Icon className={className} />;
}

export const TYPE_LABEL: Record<string, string> = {
  flight: 'Flight',
  hotel: 'Hotel',
  train: 'Train',
  bus: 'Bus',
  cab: 'Cab',
  activity: 'Activity',
  meal: 'Meal',
  transfer: 'Transfer',
  note: 'Note',
  other: 'Document',
};
