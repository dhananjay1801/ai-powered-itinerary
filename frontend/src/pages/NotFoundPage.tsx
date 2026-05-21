import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
