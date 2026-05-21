import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Booking } from '@/types';

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const res = await api.get<{ bookings: Booking[] }>('/bookings');
      return res.data.bookings;
    },
  });
}

export function useUploadBookings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData();
      files.forEach((file) => form.append('files', file));
      const res = await api.post<{ bookings: Booking[] }>('/bookings/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.bookings;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bookings/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
