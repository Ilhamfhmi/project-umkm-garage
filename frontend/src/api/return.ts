import client from './client';

export interface CariItem {
  product_id: string;
  nama: string;
  harga: number;
  qty_beli: number;
  qty_diretur: number;
  qty_sisa: number;
}

export interface CariResult {
  sale: {
    id: string;
    invoice_no: string;
    created_at: string;
    customer: string | null;
    total: string;
  };
  items: CariItem[];
}

export interface ReturnPayload {
  sale_id: string;
  tipe: 'refund' | 'tukar';
  alasan?: string;
  catatan?: string;
  items: { product_id: string; qty: number }[];
}

export interface ReturnRecord {
  id: string;
  return_no: string;
  tipe: 'refund' | 'tukar';
  total_retur: string;
  alasan: string | null;
  created_at: string;
  sale?: { invoice_no: string };
  user?: { name: string };
  items?: any[];
}

export async function cariTransaksi(invoice_no: string): Promise<CariResult> {
  const { data } = await client.post<CariResult>('/returns/cari', { invoice_no });
  return data;
}

export async function prosesRetur(payload: ReturnPayload): Promise<ReturnRecord> {
  const { data } = await client.post<ReturnRecord>('/returns', payload);
  return data;
}

export async function getReturns(): Promise<ReturnRecord[]> {
  const { data } = await client.get<ReturnRecord[]>('/returns');
  return data;
}