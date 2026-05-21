import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Download,
  Loader2,
  MapPin,
  Trash2,
} from 'lucide-react';
import {
  downloadItineraryPdf,
  useDeleteItinerary,
  useItinerary,
} from '@/hooks/useItineraries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookingTypeIcon, TYPE_LABEL } from '@/components/BookingTypeIcon';
import { formatDate, formatDateShort, getErrorMessage } from '@/lib/utils';

export default function ItineraryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: itinerary, isLoading, error } = useItinerary(id);
  const remove = useDeleteItinerary();

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!itinerary) return;
    setDownloading(true);
    try {
      await downloadItineraryPdf(itinerary.id, itinerary.title);
      toast.success('PDF downloaded.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        <p className="mt-2 text-sm">Loading itinerary…</p>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Couldn&apos;t load this itinerary.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/itineraries">Back to history</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/itineraries"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to itineraries
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">{itinerary.title}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {itinerary.destination && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {itinerary.destination}
                  </span>
                )}
                {(itinerary.startDate || itinerary.endDate) && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {itinerary.startDate && formatDate(itinerary.startDate)}
                    {itinerary.endDate && itinerary.endDate !== itinerary.startDate
                      ? ` → ${formatDate(itinerary.endDate)}`
                      : ''}
                  </span>
                )}
              </div>
              {itinerary.summary && (
                <p className="mt-4 text-sm leading-relaxed text-foreground/90 max-w-2xl">
                  {itinerary.summary}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (!confirm('Delete this itinerary?')) return;
                  remove.mutate(itinerary.id, {
                    onSuccess: () => {
                      toast.success('Itinerary deleted.');
                      navigate('/itineraries');
                    },
                    onError: (err) => toast.error(getErrorMessage(err)),
                  });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {itinerary.days.map((day, idx) => {
          const heading = day.label
            ? day.date
              ? `${day.label} · ${formatDateShort(day.date)}`
              : day.label
            : day.date
              ? formatDateShort(day.date)
              : `Day ${idx + 1}`;
          return (
            <section key={idx}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {idx + 1}
                </span>
                {heading}
              </h2>

              {day.items.length === 0 ? (
                <p className="text-sm text-muted-foreground ml-9">
                  No activities planned for this day.
                </p>
              ) : (
                <ol className="ml-3 border-l border-border pl-6 space-y-4">
                  {day.items.map((item, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[33px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border text-primary">
                        <BookingTypeIcon type={item.type} className="h-3.5 w-3.5" />
                      </span>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.time && (
                              <span className="text-sm font-medium tabular-nums">
                                {item.time}
                              </span>
                            )}
                            <Badge variant="secondary">
                              {TYPE_LABEL[item.type] ?? item.type}
                            </Badge>
                            {item.bookingRef && (
                              <span className="text-xs text-muted-foreground">
                                Ref: {item.bookingRef}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 font-medium">{item.title}</p>
                          {item.location && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {item.location}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
