import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const baseURL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL,
  timeout: 120_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      const { token, logout } = useAuthStore.getState();
      if (token) {
        logout();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.assign('/login');
        }
      }
    }
    return Promise.reject(err);
  }
);
