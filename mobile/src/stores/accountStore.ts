import { create } from 'zustand';
import api from '../services/api';
import { Account, Transaction, PaginatedResponse } from '../types';

interface AccountState {
  accounts: Account[];
  transactions: Transaction[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  fetchAccounts: () => Promise<void>;
  fetchTransactions: (params?: {
    accountId?: string;
    page?: number;
    category?: string;
  }) => Promise<void>;
  deposit: (accountId: string, amount: number, description?: string) => Promise<void>;
  transfer: (fromId: string, toId: string, amount: number) => Promise<void>;
  simulatePurchase: (
    accountId: string,
    amount: number,
    merchantName: string,
    spendingCategory: string
  ) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  transactions: [],
  isLoading: false,
  pagination: null,

  fetchAccounts: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/accounts');
      set({ accounts: response.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.get('/transactions', { params });
      const data: PaginatedResponse<Transaction> = response.data.data;
      set({
        transactions: data.transactions,
        pagination: data.pagination,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  deposit: async (accountId, amount, description) => {
    await api.post(`/accounts/${accountId}/deposit`, { amount, description });
    await get().fetchAccounts();
    await get().fetchTransactions();
  },

  transfer: async (fromId, toId, amount) => {
    await api.post('/accounts/transfer', {
      fromAccountId: fromId,
      toAccountId: toId,
      amount,
    });
    await get().fetchAccounts();
    await get().fetchTransactions();
  },

  simulatePurchase: async (accountId, amount, merchantName, spendingCategory) => {
    await api.post('/transactions/simulate', {
      accountId,
      amount,
      merchantName,
      spendingCategory,
    });
    await get().fetchAccounts();
    await get().fetchTransactions();
  },
}));
