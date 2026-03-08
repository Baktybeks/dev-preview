import { create } from 'zustand';
import type { Models } from 'appwrite';
import { getCurrentUser, logout as apiLogout } from '@api/authApi';

type User = Models.User;

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isChecked: boolean;
  setUser: (user: User | null) => void;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isChecked: false,

  setUser: (user) => set({ user, isChecked: true }),

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      set({ user, isChecked: true });
    } catch {
      set({ user: null, isChecked: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ user: null });
    try {
      await apiLogout();
    } catch {
      // сессия уже недействительна с точки зрения UI
    }
  },
}));
