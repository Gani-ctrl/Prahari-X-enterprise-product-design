import { create } from "zustand";
import type { NotificationItem } from "@/types";
import { notificationsApi } from "@/services/api";

interface NotificationState {
  items: NotificationItem[];
  isLoading: boolean;
  unreadCount: number;
  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  isLoading: false,
  unreadCount: 0,
  async fetch() {
    set({ isLoading: true });
    const items = await notificationsApi.list();
    set({ items, isLoading: false, unreadCount: items.filter((i) => !i.read).length });
  },
  async markRead(id) {
    await notificationsApi.markRead(id);
    const items = get().items.map((i) => (i.id === id ? { ...i, read: true } : i));
    set({ items, unreadCount: items.filter((i) => !i.read).length });
  },
  async markAllRead() {
    await notificationsApi.markAllRead();
    const items = get().items.map((i) => ({ ...i, read: true }));
    set({ items, unreadCount: 0 });
  },
}));
