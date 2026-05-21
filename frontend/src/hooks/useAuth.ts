import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/store/authStore';

interface AuthResponse {
  user: AuthUser;
  token: string;
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post<AuthResponse>('/auth/login', data);
      return res.data;
    },
    onSuccess: (data) => setAuth(data),
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const res = await api.post<AuthResponse>('/auth/register', data);
      return res.data;
    },
    onSuccess: (data) => setAuth(data),
  });
}
