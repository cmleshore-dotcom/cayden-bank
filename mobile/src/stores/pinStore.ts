import { create } from 'zustand';
import api from '../services/api';

interface PinState {
  hasPin: boolean;
  isPinLocked: boolean;
  isLoading: boolean;
  pinToken: string | null;
  failedAttempts: number;
  cooldownUntil: number | null;

  checkPinStatus: () => Promise<void>;
  setPin: (pin: string, password: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  removePin: (password: string) => Promise<void>;
  lockApp: () => void;
  unlockApp: () => void;
  clearPinToken: () => void;
  resetFailedAttempts: () => void;
}

export const usePinStore = create<PinState>((set, get) => ({
  hasPin: false,
  isPinLocked: false,
  isLoading: false,
  pinToken: null,
  failedAttempts: 0,
  cooldownUntil: null,

  checkPinStatus: async () => {
    try {
      const res = await api.get('/pin/status');
      set({ hasPin: res.data.data.hasPin });
    } catch {
      // silently fail
    }
  },

  setPin: async (pin: string, password: string) => {
    set({ isLoading: true });
    try {
      await api.post('/pin/set', { pin, password });
      set({ hasPin: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  verifyPin: async (pin: string) => {
    const { cooldownUntil } = get();
    if (cooldownUntil && Date.now() < cooldownUntil) {
      return false;
    }

    try {
      const res = await api.post('/pin/verify', { pin });
      const { pinToken } = res.data.data;
      set({
        isPinLocked: false,
        pinToken,
        failedAttempts: 0,
        cooldownUntil: null,
      });
      return true;
    } catch {
      const attempts = get().failedAttempts + 1;
      const update: Partial<PinState> = { failedAttempts: attempts };

      // After 3 failed attempts, 30-second cooldown
      if (attempts >= 3) {
        update.cooldownUntil = Date.now() + 30000;
        update.failedAttempts = 0;
      }

      set(update as any);
      return false;
    }
  },

  removePin: async (password: string) => {
    set({ isLoading: true });
    try {
      await api.post('/pin/remove', { password });
      set({ hasPin: false, isLoading: false, pinToken: null });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  lockApp: () => {
    if (get().hasPin) {
      set({ isPinLocked: true });
    }
  },

  unlockApp: () => {
    set({ isPinLocked: false });
  },

  clearPinToken: () => {
    set({ pinToken: null });
  },

  resetFailedAttempts: () => {
    set({ failedAttempts: 0, cooldownUntil: null });
  },
}));
