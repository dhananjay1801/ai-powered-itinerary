import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Compass, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLogin } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  const navigate = useNavigate();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (token) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  const onSubmit = (values: FormValues) => {
    login.mutate(values, {
      onSuccess: () => {
        toast.success('Welcome back!');
        navigate('/', { replace: true });
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <Compass className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to plan your next trip
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="********"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
