import client from './client';

export interface Brand {
  id: string;
  nama: string;
  category_id: string;
  products_count?: number;
}

export async function getBrands(categoryId?: string): Promise<Brand[]> {
  const { data } = await client.get<Brand[]>('/brands', {
    params: categoryId ? { category_id: categoryId } : {},
  });
  return data;
}