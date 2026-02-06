import { create } from 'zustand';
import api from '../services/api';
import { Advance, Eligibility } from '../types';

interface AdvanceState {
  eligibility: Eligibility | null;
  advances: Advance[];
  isLoading: boolean;
  checkEligibility: () => Promise<void>;
  requestAdvance: (
    amount: number,
    deliverySpeed: 'standard' | 'express',
    tip?: number
  ) => Promise<void>;
  fetchAdvances: () => Promise<void>;
  repayAdvance: (advanceId: string) => Promise<void>;
}

export const useAdvanceStore = create<AdvanceState>((set) => ({
  eligibility: null,
  advances: [],
  isLoading: false,

  checkEligibility: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/advances/eligibility');
      set({ eligibility: response.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  requestAdvance: async (amount, deliverySpeed, tip = 0) => {
    await api.post('/advances', { amount, deliverySpeed, tip });
    // Refresh eligibility and advances
    const [eligRes, advRes] = await Promise.all([
      api.get('/advances/eligibility'),
      api.get('/advances'),
    ]);
    set({
      eligibility: eligRes.data.data,
      advances: advRes.data.data,
    });
  },

  fetchAdvances: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/advances');
      set({ advances: response.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  repayAdvance: async (advanceId) => {
    await api.post(`/advances/${advanceId}/repay`);
    const response = await api.get('/advances');
    set({ advances: response.data.data });
  },
}));
