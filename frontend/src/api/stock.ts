import client from './client';
import type { Product } from '../types';

export interface StockMovement {
  id: string;
  product_id: string;
  tipe: 'in' | 'out' | 'adjust';
  qty: number;
  stok_sebelum: number;
  stok_sesudah: number;
  keterangan: string | null;
  created_at: string;
  product?: Product;
  user?: { id: number; name: string };
}

export async function getMovements(productId?: string): Promise<StockMovement[]> {
  const { data } = await client.get<StockMovement[]>('/stock', {
    params: productId ? { product_id: productId } : {},
  });
  return data;
}

export async function stockMasuk(payload: {
  product_id: string;
  qty: number;
  keterangan?: string;
}) {
  const { data } = await client.post('/stock/masuk', payload);
  return data;
}

export async function stockAdjust(payload: {
  product_id: string;
  stok_baru: number;
  keterangan?: string;
}) {
  const { data } = await client.post('/stock/adjust', payload);
  return data;
}