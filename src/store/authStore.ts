import { create } from 'zustand';
import type { Models } from 'appwrite';
import { getCurrentUser, getUserProfile, ensureUserProfile, logout as apiLogout } from '@api/authApi';
import type { AppUser } from '../types/user';

type User = Models.User;

type AuthState = {
  user: User | null;
  profile: AppUser | null;
  isLoading: boolean;
  isChecked: boolean;
  setUser: (user: User | null) => void;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: false,
  isChecked: false,

  setUser: (user) => set({ user, isChecked: true }),

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      if (user?.$id) {
        const email = (user as { email?: string }).email;
        await ensureUserProfile(user.$id, email);
      }
      const profile = user?.$id ? await getUserProfile(user.$id) : null;
      set({ user, profile: profile ?? null, isChecked: true });
    } catch {
      set({ user: null, profile: null, isChecked: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ user: null, profile: null });
    try {
      await apiLogout();
    } catch {
      // сессия уже недействительна с точки зрения UI
    }
  },
}));
