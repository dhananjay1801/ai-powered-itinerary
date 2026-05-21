import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (auth: { user: AuthUser; token: string }) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: ({ user, token }) => set({ user, token }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'wanderlog-auth',
    }
  )
);
