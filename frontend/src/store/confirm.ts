import { create } from 'zustand';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
  ask: (options: ConfirmOptions) => Promise<boolean>;
  handle: (value: boolean) => void;
}

export const useConfirm = create<ConfirmState>((set, get) => ({
  open: false,
  options: { title: '' },
  resolve: null,
  ask: (options) =>
    new Promise<boolean>((resolve) => {
      set({ open: true, options, resolve });
    }),
  handle: (value) => {
    get().resolve?.(value);
    set({ open: false, resolve: null });
  },
}));

// Helper: const ok = await confirmDialog({ title: '...' })
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return useConfirm.getState().ask(options);
}