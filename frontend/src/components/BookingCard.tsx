import { Check, FileWarning, Loader2, Trash2 } from 'lucide-react';
import type { Booking } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookingTypeIcon, TYPE_LABEL } from './BookingTypeIcon';
import { cn, formatDateShort } from '@/lib/utils';

interface BookingCardProps {
  booking: Booking;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  onDelete?: () => void;
  selectable?: boolean;
}

export function BookingCard({
  booking,
  selected,
  onSelectChange,
  onDelete,
  selectable = true,
}: BookingCardProps) {
  const ext = booking.extractedData;
  const isParsing = booking.status === 'parsing';
  const isFailed = booking.status === 'failed';
  const isParsed = booking.status === 'parsed';

  const title =
    ext?.title ??
    [ext?.origin, ext?.destination].filter(Boolean).join(' → ') ??
    booking.originalName;

  return (
    <Card
      className={cn(
        'relative p-4 transition-all',
        selected && 'ring-2 ring-primary border-primary',
        selectable && onSelectChange && 'cursor-pointer hover:border-primary/50'
      )}
      onClick={() => {
        if (selectable && onSelectChange && isParsed) {
          onSelectChange(!selected);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            isFailed
              ? 'bg-destructive/10 text-destructive'
              : 'bg-primary/10 text-primary'
          )}
        >
          {isParsing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isFailed ? (
            <FileWarning className="h-5 w-5" />
          ) : (
            <BookingTypeIcon type={ext?.type} className="h-5 w-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium leading-tight truncate">{title}</p>
            {ext?.type && (
              <Badge variant="secondary">{TYPE_LABEL[ext.type] ?? ext.type}</Badge>
            )}
            {isParsing && <Badge variant="warning">Parsing…</Badge>}
            {isFailed && <Badge variant="destructive">Parse failed</Badge>}
            {isParsed && !ext && <Badge variant="warning">No data</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {booking.originalName}
          </p>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {ext?.provider && <span>{ext.provider}</span>}
            {ext?.bookingReference && <span>Ref: {ext.bookingReference}</span>}
            {ext?.startDateTime && <span>{formatDateShort(ext.startDateTime)}</span>}
            {ext?.endDateTime && ext?.endDateTime !== ext?.startDateTime && (
              <span>→ {formatDateShort(ext.endDateTime)}</span>
            )}
          </div>

          {booking.errorMessage && (
            <p className="mt-2 text-xs text-destructive">{booking.errorMessage}</p>
          )}
        </div>

        {selected && (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3.5 w-3.5" />
          </div>
        )}

        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
            title="Remove booking"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
