import client from './client';
import type { DashboardData, Sale } from '../types';

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await client.get<DashboardData>('/reports/dashboard');
  return data;
}

export interface LaporanPenjualan {
  periode: { from: string; to: string };
  ringkasan: {
    jumlah_transaksi: number;
    total_omzet: number;
    total_diskon: number;
  };
  transaksi: Sale[];
}

export interface ProdukTerlaris {
  nama: string;
  total_terjual: number;
  total_omzet: number;
}

export async function getLaporanPenjualan(from: string, to: string): Promise<LaporanPenjualan> {
  const { data } = await client.get<LaporanPenjualan>('/reports/penjualan', {
    params: { from, to },
  });
  return data;
}

export async function getProdukTerlaris(from: string, to: string): Promise<ProdukTerlaris[]> {
  const { data } = await client.get<ProdukTerlaris[]>('/reports/produk-terlaris', {
    params: { from, to },
  });
  return data;
}