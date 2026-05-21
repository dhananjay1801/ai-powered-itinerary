import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, MapPin, Trash2, Upload } from 'lucide-react';
import {
  useDeleteItinerary,
  useItineraries,
} from '@/hooks/useItineraries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateShort, getErrorMessage } from '@/lib/utils';

export default function HistoryPage() {
  const { data: itineraries = [], isLoading } = useItineraries();
  const remove = useDeleteItinerary();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All itineraries</h1>
          <p className="text-muted-foreground mt-1">
            Every trip you&apos;ve generated, sorted by most recent.
          </p>
        </div>
        <Button asChild>
          <Link to="/upload">
            <Upload className="h-4 w-4" />
            New itinerary
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : itineraries.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground mb-4">No itineraries yet.</p>
          <Button asChild>
            <Link to="/upload">
              <Upload className="h-4 w-4" />
              Upload bookings
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {itineraries.map((it) => (
            <Card key={it.id} className="group h-full transition-colors hover:border-primary/50">
              <Link to={`/itineraries/${it.id}`} className="block">
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">
                    {formatDateShort(it.createdAt)}
                  </p>
                  <p className="font-semibold mt-1 line-clamp-2 group-hover:text-primary">
                    {it.title}
                  </p>
                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {it.destination && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {it.destination}
                      </p>
                    )}
                    {(it.startDate || it.endDate) && (
                      <p className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {it.startDate && formatDateShort(it.startDate)}
                        {it.endDate && it.endDate !== it.startDate
                          ? ` → ${formatDateShort(it.endDate)}`
                          : ''}
                      </p>
                    )}
                    <p className="text-xs">
                      {it.days.length} day{it.days.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </CardContent>
              </Link>
              <div className="px-5 pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (!confirm(`Delete itinerary "${it.title}"?`)) return;
                    remove.mutate(it.id, {
                      onSuccess: () => toast.success('Itinerary deleted.'),
                      onError: (err) => toast.error(getErrorMessage(err)),
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
