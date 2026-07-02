import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push(toast) {
    const id = Math.random().toString(36).slice(2, 10);
    set({ toasts: [...get().toasts, { ...toast, id }] });
    setTimeout(() => get().dismiss(id), 4200);
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().push({ title, description, variant: "success" }),
  error: (title: string, description?: string) => useToastStore.getState().push({ title, description, variant: "error" }),
  info: (title: string, description?: string) => useToastStore.getState().push({ title, description, variant: "info" }),
  warning: (title: string, description?: string) => useToastStore.getState().push({ title, description, variant: "warning" }),
};
