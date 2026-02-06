import { create } from 'zustand';
import api from '../services/api';
import { SpendingCategory, BudgetPrediction, IncomeExpense } from '../types';

interface BudgetState {
  spending: {
    month: string;
    totalSpent: number;
    categories: SpendingCategory[];
  } | null;
  incomeExpense: IncomeExpense[];
  prediction: BudgetPrediction | null;
  isLoading: boolean;
  fetchSpending: (month?: string) => Promise<void>;
  fetchIncomeExpense: (months?: number) => Promise<void>;
  fetchPrediction: () => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  spending: null,
  incomeExpense: [],
  prediction: null,
  isLoading: false,

  fetchSpending: async (month) => {
    set({ isLoading: true });
    try {
      const response = await api.get('/budget/spending', {
        params: month ? { month } : {},
      });
      set({ spending: response.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchIncomeExpense: async (months = 3) => {
    try {
      const response = await api.get('/budget/income-expense', {
        params: { months },
      });
      set({ incomeExpense: response.data.data });
    } catch {
      // ignore
    }
  },

  fetchPrediction: async () => {
    try {
      const response = await api.get('/budget/prediction');
      set({ prediction: response.data.data });
    } catch {
      // ignore
    }
  },
}));
