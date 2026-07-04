import client from './client';
import type { Category } from '../types';

export async function getCategories(): Promise<Category[]> {
  const { data } = await client.get<Category[]>('/categories');
  return data;
}

export async function createCategory(payload: { nama: string; deskripsi?: string }) {
  const { data } = await client.post('/categories', payload);
  return data;
}

export async function updateCategory(id: string, payload: { nama: string; deskripsi?: string }) {
  const { data } = await client.put(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: string) {
  await client.delete(`/categories/${id}`);
}