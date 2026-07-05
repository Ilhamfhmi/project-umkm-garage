import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastState {
  toasts: Toast[];
  show: (type: ToastType, title: string, message?: string) => void;
  remove: (id: number) => void;
}

let counter = 0;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  show: (type, title, message) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, type, title, message }] }));
    // auto-hilang setelah 4 detik
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Helper biar gampang dipanggil: toast.success('...'), toast.error('...')
export const toast = {
  success: (title: string, message?: string) => useToast.getState().show('success', title, message),
  error: (title: string, message?: string) => useToast.getState().show('error', title, message),
  warning: (title: string, message?: string) => useToast.getState().show('warning', title, message),
  info: (title: string, message?: string) => useToast.getState().show('info', title, message),
};