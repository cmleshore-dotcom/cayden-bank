import { create } from 'zustand';
import { getItem, setItem, deleteItem } from '../utils/storage';
import api from '../services/api';
import { User } from '../types';

const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDarkMode: boolean;
  lastActivityTime: number;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  toggleDarkMode: () => void;
  resetActivity: () => void;
  checkSessionTimeout: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isDarkMode: false,
  lastActivityTime: Date.now(),

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = response.data.data;

    await setItem('accessToken', accessToken);
    await setItem('refreshToken', refreshToken);

    set({ user, isAuthenticated: true, lastActivityTime: Date.now() });
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data);
    const { user, accessToken, refreshToken } = response.data.data;

    await setItem('accessToken', accessToken);
    await setItem('refreshToken', refreshToken);

    set({ user, isAuthenticated: true, lastActivityTime: Date.now() });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    }
    await deleteItem('accessToken');
    await deleteItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const token = await getItem('accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const response = await api.get('/auth/me');
      set({
        user: response.data.data,
        isAuthenticated: true,
        isLoading: false,
        lastActivityTime: Date.now(),
      });
    } catch {
      await deleteItem('accessToken');
      await deleteItem('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  toggleDarkMode: () => {
    set({ isDarkMode: !get().isDarkMode });
  },

  resetActivity: () => {
    set({ lastActivityTime: Date.now() });
  },

  checkSessionTimeout: () => {
    const { isAuthenticated, lastActivityTime } = get();
    if (!isAuthenticated) return false;

    const elapsed = Date.now() - lastActivityTime;
    if (elapsed >= SESSION_TIMEOUT_MS) {
      // Auto-logout
      get().logout();
      return true; // timed out
    }
    return false;
  },
}));
