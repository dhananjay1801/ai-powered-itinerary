import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Compass, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRegister } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent } from '@/components/ui/card';
import { getErrorMessage } from '@/lib/utils';

const schema = z
  .object({
    name: z.string().min(1, 'Tell us your name').max(80),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const reg = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (token) return <Navigate to="/" replace />;

  const onSubmit = ({ confirmPassword: _c, ...values }: FormValues) => {
    reg.mutate(values, {
      onSuccess: () => {
        toast.success('Account created. Let\'s plan your trip!');
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
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Turn booking PDFs into beautiful itineraries
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
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
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={reg.isPending}>
                {reg.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create account
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
