import client from './client';

export interface CheckoutItem {
  product_id: string;
  qty: number;
}

export interface CheckoutPayload {
  tipe_harga: 'umum' | 'mitra';
  bayar: number;
  diskon?: number;
  customer_id?: string | null;
  items: CheckoutItem[];
}

export async function checkout(payload: CheckoutPayload) {
  const { data } = await client.post('/sales', payload);
  return data;
}