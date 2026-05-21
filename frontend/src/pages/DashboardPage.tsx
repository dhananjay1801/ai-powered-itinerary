import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Sparkles, Upload } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useItineraries } from '@/hooks/useItineraries';
import { useBookings } from '@/hooks/useBookings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/lib/utils';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: itineraries = [], isLoading: itinLoading } = useItineraries();
  const { data: bookings = [], isLoading: bookLoading } = useBookings();

  const recent = itineraries.slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-3xl font-semibold tracking-tight">{user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground mt-1 max-w-xl">
          Upload your travel documents and let AI build a clean, day-by-day itinerary you can share.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="text-2xl font-semibold">
                  {bookLoading ? '…' : bookings.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Itineraries</p>
                <p className="text-2xl font-semibold">
                  {itinLoading ? '…' : itineraries.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Plan a new trip</p>
                <p className="text-lg font-semibold">Generate itinerary</p>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link to="/upload">
                  <Sparkles className="h-4 w-4" />
                  Start
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent itineraries</h2>
          {itineraries.length > 0 && (
            <Link
              to="/itineraries"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {itinLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : recent.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-muted-foreground mb-4">
              You don&apos;t have any itineraries yet.
            </p>
            <Button asChild>
              <Link to="/upload">
                <Upload className="h-4 w-4" />
                Upload bookings
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {recent.map((it) => (
              <Link key={it.id} to={`/itineraries/${it.id}`}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardContent className="p-5">
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(it.createdAt)}
                    </p>
                    <p className="font-semibold mt-1 line-clamp-2">{it.title}</p>
                    {it.destination && (
                      <p className="text-sm text-muted-foreground mt-1">{it.destination}</p>
                    )}
                    {(it.startDate || it.endDate) && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {it.startDate && formatDateShort(it.startDate)}
                        {it.endDate && it.endDate !== it.startDate
                          ? ` → ${formatDateShort(it.endDate)}`
                          : ''}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
