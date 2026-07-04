import type { Role } from '../types';

export const menuAccess: Record<string, Role[]> = {
  '/':          ['admin', 'staff', 'owner'],
  '/kasir':     ['admin', 'staff'],
  '/retur':     ['admin', 'staff'],
  '/produk':    ['admin', 'staff', 'owner'],
  '/kategori':  ['admin'],
  '/stok':      ['admin', 'staff', 'owner'],
  '/pelanggan': ['admin', 'staff', 'owner'],
  '/laporan':   ['admin', 'owner'],
};

export function canAccess(path: string, role: Role | undefined): boolean {
  if (!role) return false;
  const allowed = menuAccess[path];
  return allowed ? allowed.includes(role) : false;
}

export function can(role: Role | undefined) {
  return {
    kelolaProduk:    role === 'admin',
    kelolaKategori:  role === 'admin',
    ubahStok:        role === 'admin' || role === 'staff',
    transaksi:       role === 'admin' || role === 'staff',
    prosesRetur:     role === 'admin' || role === 'staff',
    lihatLaporan:    role === 'admin' || role === 'owner',
    kelolaPelanggan: role === 'admin' || role === 'staff' || role === 'owner',
  };
}