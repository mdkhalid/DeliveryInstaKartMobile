import { create } from 'zustand';
import { authAPI, userAPI } from '@/lib/api';
import { setTokens, clearTokens, setUserId } from '@/lib/storage';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      const { data } = await userAPI.getProfile();
      set({ user: data.data, isAuthenticated: true, isInitialized: true });
    } catch {
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.login({ email, password });
      const { accessToken, refreshToken } = data.data;
      await setTokens(accessToken, refreshToken);
      await setUserId(data.data.user.id);
      set({ user: data.data.user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  sendOtp: async (phone) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.sendOtp(phone);
      set({ isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  verifyOtp: async (phone, code) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.verifyOtp(phone, code);
      const { accessToken, refreshToken } = data.data;
      await setTokens(accessToken, refreshToken);
      await setUserId(data.data.user.id);
      set({ user: data.data.user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'OTP verification failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    await clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await userAPI.updateProfile(profileData);
      const currentUser = get().user;
      set({ user: { ...currentUser!, ...data.data }, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  refreshProfile: async () => {
    try {
      const { data } = await userAPI.getProfile();
      set({ user: data.data });
    } catch { /* silent */ }
  },

  clearError: () => set({ error: null }),
}));
