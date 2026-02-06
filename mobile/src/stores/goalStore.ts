import { create } from 'zustand';
import api from '../services/api';
import { Goal } from '../types';

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  fetchGoals: () => Promise<void>;
  createGoal: (data: {
    name: string;
    targetAmount: number;
    targetDate?: string;
    icon?: string;
  }) => Promise<void>;
  fundGoal: (goalId: string, amount: number) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  isLoading: false,

  fetchGoals: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/goals');
      set({ goals: response.data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createGoal: async (data) => {
    await api.post('/goals', data);
    const response = await api.get('/goals');
    set({ goals: response.data.data });
  },

  fundGoal: async (goalId, amount) => {
    await api.post(`/goals/${goalId}/fund`, { amount });
    const response = await api.get('/goals');
    set({ goals: response.data.data });
  },

  deleteGoal: async (goalId) => {
    await api.delete(`/goals/${goalId}`);
    const response = await api.get('/goals');
    set({ goals: response.data.data });
  },
}));
