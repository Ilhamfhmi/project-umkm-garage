export type Role = 'admin' | 'staff' | 'owner';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
}

export interface Category {
  id: string;
  nama: string;
  deskripsi: string | null;
  products_count?: number;
}

export interface Product {
  id: string;
  category_id: string | null;
  brand_id: string | null;
  sub_kategori: string | null;
  nama: string;
  sku: string | null;
  satuan: string;
  stok: number;
  stok_minimum: number;
  harga_beli: string;
  harga_umum: string;
  harga_mitra: string;
  is_active: boolean;
  category?: { id: string; nama: string } | null;
  brand?: { id: string; nama: string } | null;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface Sale {
  id: string;
  invoice_no: string;
  customer_id: string | null;
  kasir_id: number | null;
  tipe_harga: 'umum' | 'mitra';
  subtotal: string;
  diskon: string;
  total: string;
  bayar: string;
  kembalian: string;
  created_at: string;
  kasir?: { id: number; name: string };
}

export interface DashboardData {
  penjualan_hari_ini: { jumlah_transaksi: number; total_omzet: number; total_retur: number };
  penjualan_bulan_ini: { jumlah_transaksi: number; total_omzet: number; total_retur: number };
  total_produk: number;
  stok_menipis: { id: string; nama: string; stok: number; stok_minimum: number }[];
  transaksi_terbaru: Sale[];
}