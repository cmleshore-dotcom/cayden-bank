import { create } from 'zustand';
import api from '../services/api';
import { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/notifications');
      const data = res.data.data;
      set({
        notifications: data.notifications,
        total: data.total,
        unreadCount: data.unread,
      });
    } catch {
      // ignore
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      set({ unreadCount: res.data.data.unread });
    } catch {
      // ignore
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      const notifications = get().notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter((n) => !n.read).length;
      set({ notifications, unreadCount });
    } catch {
      // ignore
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/notifications/read-all');
      const notifications = get().notifications.map((n) => ({ ...n, read: true }));
      set({ notifications, unreadCount: 0 });
    } catch {
      // ignore
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      const notifications = get().notifications.filter((n) => n.id !== notificationId);
      const unreadCount = notifications.filter((n) => !n.read).length;
      set({ notifications, unreadCount });
    } catch {
      // ignore
    }
  },
}));
