import { create } from 'zustand';
import type { Product } from '../types';

export interface CartItem {
  product: Product;
  qty: number;
  harga: number; // harga sesuai tipe (umum/mitra) saat ditambahkan
}

interface CartState {
  items: CartItem[];
  tipeHarga: 'umum' | 'mitra';
  setTipeHarga: (t: 'umum' | 'mitra') => void;
  addItem: (product: Product, qty: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  subtotal: () => number;
}

function hargaProduk(product: Product, tipe: 'umum' | 'mitra'): number {
  return parseFloat(tipe === 'mitra' ? product.harga_mitra : product.harga_umum);
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  tipeHarga: 'umum',

  setTipeHarga: (t) =>
    set((state) => ({
      tipeHarga: t,
      // hitung ulang harga semua item saat tipe berubah
      items: state.items.map((it) => ({
        ...it,
        harga: hargaProduk(it.product, t),
      })),
    })),

  addItem: (product, qty) =>
    set((state) => {
      const existing = state.items.find((it) => it.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((it) =>
            it.product.id === product.id
              ? { ...it, qty: it.qty + qty }
              : it
          ),
        };
      }
      return {
        items: [
          ...state.items,
          { product, qty, harga: hargaProduk(product, state.tipeHarga) },
        ],
      };
    }),

  updateQty: (productId, qty) =>
    set((state) => ({
      items: qty <= 0
        ? state.items.filter((it) => it.product.id !== productId)
        : state.items.map((it) =>
            it.product.id === productId ? { ...it, qty } : it
          ),
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((it) => it.product.id !== productId),
    })),

  clear: () => set({ items: [] }),

  subtotal: () =>
    get().items.reduce((sum, it) => sum + it.harga * it.qty, 0),
}));