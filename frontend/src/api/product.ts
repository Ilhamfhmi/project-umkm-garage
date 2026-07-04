import client from './client';
import type { Product } from '../types';

export async function searchProducts(search: string): Promise<Product[]> {
  const { data } = await client.get<Product[]>('/products', {
    params: search ? { search } : {},
  });
  return data;
}

export interface ProductPayload {
  category_id?: string | null;
  nama: string;
  sku?: string | null;
  satuan?: string;
  stok?: number;
  stok_minimum?: number;
  harga_beli?: number;
  harga_umum: number;
  harga_mitra: number;
  is_active?: boolean;
}

export async function createProduct(payload: ProductPayload) {
  const { data } = await client.post('/products', payload);
  return data;
}

export async function updateProduct(id: string, payload: ProductPayload) {
  const { data } = await client.put(`/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id: string) {
  await client.delete(`/products/${id}`);
}