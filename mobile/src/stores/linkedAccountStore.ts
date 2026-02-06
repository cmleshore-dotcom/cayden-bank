import { create } from 'zustand';
import api from '../services/api';
import { LinkedAccount } from '../types';

interface LinkedAccountState {
  linkedAccounts: LinkedAccount[];
  isLoading: boolean;
  fetchLinkedAccounts: () => Promise<void>;
  linkAccount: (input: {
    bankName: string;
    accountHolderName: string;
    accountNumberLast4: string;
    routingNumber: string;
    accountType: 'checking' | 'savings';
  }) => Promise<LinkedAccount>;
  verifyAccount: (accountId: string) => Promise<void>;
  setPrimary: (accountId: string) => Promise<void>;
  unlinkAccount: (accountId: string) => Promise<void>;
}

export const useLinkedAccountStore = create<LinkedAccountState>((set, get) => ({
  linkedAccounts: [],
  isLoading: false,

  fetchLinkedAccounts: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/linked-accounts');
      set({ linkedAccounts: response.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  linkAccount: async (input) => {
    const response = await api.post('/linked-accounts', input);
    const newAccount: LinkedAccount = response.data.data;
    await get().fetchLinkedAccounts();
    return newAccount;
  },

  verifyAccount: async (accountId) => {
    await api.post(`/linked-accounts/${accountId}/verify`);
    await get().fetchLinkedAccounts();
  },

  setPrimary: async (accountId) => {
    await api.post(`/linked-accounts/${accountId}/primary`);
    await get().fetchLinkedAccounts();
  },

  unlinkAccount: async (accountId) => {
    await api.delete(`/linked-accounts/${accountId}`);
    await get().fetchLinkedAccounts();
  },
}));
