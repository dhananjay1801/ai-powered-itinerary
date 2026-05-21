import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Itinerary } from '@/types';

export function useItineraries() {
  return useQuery({
    queryKey: ['itineraries'],
    queryFn: async () => {
      const res = await api.get<{ itineraries: Itinerary[] }>('/itineraries');
      return res.data.itineraries;
    },
  });
}

export function useItinerary(id: string | undefined) {
  return useQuery({
    queryKey: ['itinerary', id],
    queryFn: async () => {
      const res = await api.get<{ itinerary: Itinerary }>(`/itineraries/${id}`);
      return res.data.itinerary;
    },
    enabled: !!id,
  });
}

export function useCreateItinerary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { bookingIds: string[]; title?: string }) => {
      const res = await api.post<{ itinerary: Itinerary }>('/itineraries', data);
      return res.data.itinerary;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['itineraries'] });
    },
  });
}

export function useDeleteItinerary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/itineraries/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['itineraries'] });
    },
  });
}

export async function downloadItineraryPdf(id: string, fileName: string): Promise<void> {
  const res = await api.get(`/itineraries/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName.replace(/[^a-z0-9-_ ]/gi, '').replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
