import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(err: unknown): string {
  if (!err) return 'Something went wrong.';
  if (typeof err === 'string') return err;
  const anyErr = err as {
    response?: { data?: { error?: { message?: string } } };
    message?: string;
  };
  return (
    anyErr.response?.data?.error?.message ?? anyErr.message ?? 'Something went wrong.'
  );
}

export function formatDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
