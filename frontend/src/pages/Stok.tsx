import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, PackagePlus, SlidersHorizontal, X,
  ArrowUp, ArrowDown, Settings2, Boxes,
} from 'lucide-react';
import { searchProducts } from '../api/product';
import { getMovements, stockMasuk, stockAdjust, type StockMovement } from '../api/stock';
import { tanggal } from '../lib/format';
import { useAuth } from '../store/auth';
import { can } from '../lib/permissions';
import type { Product } from '../types';

type ModalMode = 'masuk' | 'adjust' | null;

export default function Stok() {
  const role = useAuth((s) => s.user?.role);
  const izin = can(role);

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [qty, setQty] = useState(0);
  const [stokBaru, setStokBaru] = useState(0);
  const [keterangan, setKeterangan] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadProducts() {
    setLoading(true);
    try {
      setProducts(await searchProducts(search));
    } finally {
      setLoading(false);
    }
  }

  async function loadMovements() {
    try {
      setMovements(await getMovements());
    } catch {
      // abaikan
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    loadMovements();
  }, []);

  function openMasuk(p: Product) {
    setSelected(p);
    setMode('masuk');
    setQty(0);
    setKeterangan('');
    setError('');
  }

  function openAdjust(p: Product) {
    setSelected(p);
    setMode('adjust');
    setStokBaru(p.stok);
    setKeterangan('');
    setError('');
  }

  function closeModal() {
    setMode(null);
    setSelected(null);
  }

  async function handleSave() {
    if (!selected) return;
    setError('');

    if (mode === 'masuk' && qty <= 0) {
      setError('Jumlah harus lebih dari 0.');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'masuk') {
        await stockMasuk({ product_id: selected.id, qty, keterangan });
      } else if (mode === 'adjust') {
        await stockAdjust({ product_id: selected.id, stok_baru: stokBaru, keterangan });
      }
      closeModal();
      loadProducts();
      loadMovements();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal memproses.');
    } finally {
      setSaving(false);
    }
  }

  const tipeConfig = {
    in: { label: 'Masuk', icon: ArrowUp, color: 'text-green-400' },
    out: { label: 'Keluar', icon: ArrowDown, color: 'text-red-400' },
    adjust: { label: 'Penyesuaian', icon: Settings2, color: 'text-blue-400' },
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">Stok</h1>
        <p className="text-sm text-zinc-500">Kelola barang masuk & pergerakan stok</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daftar produk + aksi stok */}
        <div>
          <h2 className="text-sm font-semibold mb-2 text-zinc-400">Produk</h2>
          {loading ? (
            <p className="text-sm text-zinc-500">Memuat...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Tidak ada produk.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((p) => {
                const menipis = p.stok <= p.stok_minimum && p.stok_minimum > 0;
                return (
                  <div
                    key={p.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.nama}</div>
                      <div className={`text-xs ${menipis ? 'text-red-400' : 'text-zinc-500'}`}>
                        Stok: {p.stok} {p.satuan}
                        {menipis && ' (menipis)'}
                      </div>
                    </div>
                    {izin.ubahStok && (
                      <>
                        <button
                          onClick={() => openMasuk(p)}
                          title="Barang masuk"
                          className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition"
                        >
                          <PackagePlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openAdjust(p)}
                          title="Sesuaikan stok"
                          className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Riwayat pergerakan */}
        <div>
          <h2 className="text-sm font-semibold mb-2 text-zinc-400">Riwayat Pergerakan</h2>
          {movements.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada pergerakan stok.</p>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {movements.map((m) => {
                const cfg = tipeConfig[m.tipe];
                const Icon = cfg.icon;
                return (
                  <div
                    key={m.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center gap-3"
                  >
                    <div className={`p-1.5 rounded-lg bg-zinc-800 ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {m.product?.nama ?? 'Produk'}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {cfg.label} · {m.stok_sebelum} → {m.stok_sesudah} · {tanggal(m.created_at)}
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${cfg.color}`}>
                      {m.tipe === 'in' ? '+' : m.tipe === 'out' ? '-' : '±'}{m.qty}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {mode && selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">
                  {mode === 'masuk' ? 'Barang Masuk' : 'Sesuaikan Stok'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-zinc-950 rounded-lg p-3 mb-4">
                <div className="text-sm font-medium">{selected.nama}</div>
                <div className="text-xs text-zinc-500">
                  Stok saat ini: {selected.stok} {selected.satuan}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-3">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {mode === 'masuk' ? (
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Jumlah Masuk</label>
                    <input
                      type="number"
                      value={qty || ''}
                      onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                      autoFocus
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                    {qty > 0 && (
                      <p className="text-xs text-zinc-500 mt-1">
                        Stok jadi: {selected.stok + qty} {selected.satuan}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Stok Baru (hasil opname)</label>
                    <input
                      type="number"
                      value={stokBaru}
                      onChange={(e) => setStokBaru(parseInt(e.target.value) || 0)}
                      autoFocus
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Selisih: {stokBaru - selected.stok > 0 ? '+' : ''}{stokBaru - selected.stok}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Keterangan (opsional)</label>
                  <input
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder={mode === 'masuk' ? 'Contoh: Restok dari supplier' : 'Contoh: Koreksi hasil opname'}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg py-2.5 text-sm transition disabled:opacity-50"
                >
                  {saving ? 'Memproses...' : 'Simpan'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}