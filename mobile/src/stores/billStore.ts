import { create } from 'zustand';
import api from '../services/api';
import { Bill, BillSummary } from '../types';

interface BillState {
  bills: Bill[];
  summary: BillSummary | null;
  isLoading: boolean;
  fetchBills: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  createBill: (data: {
    accountId: string;
    name: string;
    category: string;
    amount: number;
    frequency: string;
    dueDay: number;
    autoPay: boolean;
  }) => Promise<void>;
  updateBill: (billId: string, updates: Partial<Bill>) => Promise<void>;
  payBill: (billId: string) => Promise<{ newBalance: number }>;
  deleteBill: (billId: string) => Promise<void>;
}

export const useBillStore = create<BillState>((set, get) => ({
  bills: [],
  summary: null,
  isLoading: false,

  fetchBills: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/bills');
      set({ bills: res.data.data });
    } catch {
      // ignore - table might not exist yet
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSummary: async () => {
    try {
      const res = await api.get('/bills/summary');
      set({ summary: res.data.data });
    } catch {
      // ignore
    }
  },

  createBill: async (data) => {
    try {
      const res = await api.post('/bills', data);
      set({ bills: [...get().bills, res.data.data] });
    } catch (err) {
      throw err;
    }
  },

  updateBill: async (billId, updates) => {
    try {
      const res = await api.put(`/bills/${billId}`, updates);
      const bills = get().bills.map((b) =>
        b.id === billId ? res.data.data : b
      );
      set({ bills });
    } catch (err) {
      throw err;
    }
  },

  payBill: async (billId) => {
    try {
      const res = await api.post(`/bills/${billId}/pay`);
      // Refresh bills list after payment
      await get().fetchBills();
      return { newBalance: res.data.data.newBalance };
    } catch (err) {
      throw err;
    }
  },

  deleteBill: async (billId) => {
    try {
      await api.delete(`/bills/${billId}`);
      const bills = get().bills.filter((b) => b.id !== billId);
      set({ bills });
    } catch (err) {
      throw err;
    }
  },
}));
