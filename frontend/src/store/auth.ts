import { create } from 'zustand';
import type { User } from '../types';
import * as authApi from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,

  login: async (email, password) => {
    const { user, token } = await authApi.login(email, password);
    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // abaikan error
    }
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    set({ loading: true });
    try {
      const user = await authApi.getMe();
      set({ user, token });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    } finally {
      set({ loading: false });
    }
  },
}));