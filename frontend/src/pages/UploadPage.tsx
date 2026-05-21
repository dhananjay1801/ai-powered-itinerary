import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { Dropzone } from '@/components/upload/Dropzone';
import { BookingCard } from '@/components/BookingCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  useBookings,
  useDeleteBooking,
  useUploadBookings,
} from '@/hooks/useBookings';
import { useCreateItinerary } from '@/hooks/useItineraries';
import { getErrorMessage } from '@/lib/utils';

export default function UploadPage() {
  const navigate = useNavigate();
  const { data: bookings = [], isLoading } = useBookings();
  const upload = useUploadBookings();
  const remove = useDeleteBooking();
  const create = useCreateItinerary();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const parsedBookings = useMemo(
    () => bookings.filter((b) => b.status === 'parsed'),
    [bookings]
  );

  const onFiles = (files: File[]) => {
    upload.mutate(files, {
      onSuccess: (newBookings) => {
        const parsedCount = newBookings.filter((b) => b.status === 'parsed').length;
        const failedCount = newBookings.filter((b) => b.status === 'failed').length;
        toast.success(
          `${parsedCount} document${parsedCount === 1 ? '' : 's'} processed${
            failedCount ? `, ${failedCount} failed` : ''
          }.`
        );
        setSelected((prev) => {
          const next = new Set(prev);
          newBookings
            .filter((b) => b.status === 'parsed')
            .forEach((b) => next.add(b.id));
          return next;
        });
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const toggleSelected = (id: string, value: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleGenerate = () => {
    const bookingIds = Array.from(selected);
    if (bookingIds.length === 0) {
      toast.error('Select at least one booking.');
      return;
    }
    create.mutate(
      { bookingIds },
      {
        onSuccess: (itinerary) => {
          toast.success('Itinerary created!');
          navigate(`/itineraries/${itinerary.id}`);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload travel documents</h1>
        <p className="text-muted-foreground mt-1">
          Drop in flight tickets, hotel confirmations, or train bookings. Our AI will extract
          the details and turn them into a clean itinerary.
        </p>
      </div>

      <Card className="p-6">
        <Dropzone onFiles={onFiles} disabled={upload.isPending} />
        {upload.isPending && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading and parsing with Gemini…
          </p>
        )}
      </Card>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Your bookings</h2>
          <p className="text-sm text-muted-foreground">
            {parsedBookings.length} ready · {selected.size} selected
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : bookings.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-muted-foreground">
              No bookings yet. Upload your first one above to get started.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                selected={selected.has(b.id)}
                onSelectChange={(v) => toggleSelected(b.id, v)}
                onDelete={() =>
                  remove.mutate(b.id, {
                    onSuccess: () => {
                      toast.success('Booking removed.');
                      setSelected((prev) => {
                        const next = new Set(prev);
                        next.delete(b.id);
                        return next;
                      });
                    },
                    onError: (err) => toast.error(getErrorMessage(err)),
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      <div className="sticky bottom-4 z-30 flex justify-end">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={create.isPending || selected.size === 0}
          className="shadow-lg"
        >
          {create.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate itinerary ({selected.size})
        </Button>
      </div>
    </div>
  );
}
