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
import { toast } from '../store/toast';
import type { Product } from '../types';

type ModalMode = 'masuk' | 'adjust' | null;

const inputCls = `w-full bg-white border border-line rounded-lg px-3 py-2.5 text-sm text-ink
  placeholder:text-slate-400 transition
  focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10`;

const tipeConfig = {
  in:     { label: 'Masuk',        icon: ArrowUp,    bg: 'bg-emerald-50',  color: 'text-emerald-600' },
  out:    { label: 'Keluar',       icon: ArrowDown,  bg: 'bg-red-50',      color: 'text-red-600'     },
  adjust: { label: 'Penyesuaian',  icon: Settings2,  bg: 'bg-blue-50',     color: 'text-blue-600'    },
};

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
        toast.success('Stok diperbarui', `+${qty} ${selected.satuan} untuk ${selected.nama}.`);
      } else if (mode === 'adjust') {
        await stockAdjust({ product_id: selected.id, stok_baru: stokBaru, keterangan });
        toast.success('Stok disesuaikan', `${selected.nama} → ${stokBaru} ${selected.satuan}.`);
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Stok</h1>
        <p className="text-sm text-muted mt-0.5">Kelola barang masuk & pergerakan stok.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk..."
          className="w-full bg-white border border-line rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink
            placeholder:text-slate-400 transition
            focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Daftar produk ── */}
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center gap-2">
            <Boxes className="w-4 h-4 text-muted" />
            <h2 className="text-sm font-semibold text-ink">Daftar Produk</h2>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center">
              <Boxes className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-muted">Tidak ada produk.</p>
            </div>
          ) : (
            <div className="divide-y divide-line max-h-[60vh] overflow-y-auto">
              {products.map((p) => {
                const menipis = p.stok <= p.stok_minimum && p.stok_minimum > 0;
                return (
                  <div
                    key={p.id}
                    className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{p.nama}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-xs font-medium ${menipis ? 'text-amber-600' : 'text-muted'}`}>
                          {p.stok} {p.satuan}
                        </span>
                        {menipis && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">
                            menipis
                          </span>
                        )}
                      </div>
                    </div>
                    {izin.ubahStok && (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => openMasuk(p)}
                          title="Barang masuk"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                            bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          Masuk
                        </button>
                        <button
                          onClick={() => openAdjust(p)}
                          title="Sesuaikan stok"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                            bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          Sesuaikan
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Riwayat pergerakan ── */}
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-muted" />
              <h2 className="text-sm font-semibold text-ink">Riwayat Pergerakan</h2>
            </div>
            <span className="text-xs text-muted">{movements.length} catatan</span>
          </div>

          {movements.length === 0 ? (
            <div className="py-12 text-center">
              <ArrowUp className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-muted">Belum ada pergerakan stok.</p>
            </div>
          ) : (
            <div className="divide-y divide-line max-h-[60vh] overflow-y-auto">
              {movements.map((m, i) => {
                const cfg = tipeConfig[m.tipe];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition"
                  >
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">
                        {m.product?.nama ?? 'Produk'}
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        {cfg.label} · {m.stok_sebelum} → {m.stok_sesudah} · {tanggal(m.created_at)}
                      </div>
                    </div>
                    <div className={`text-sm font-bold shrink-0 ${cfg.color}`}>
                      {m.tipe === 'in' ? '+' : m.tipe === 'out' ? '-' : '±'}{m.qty}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal barang masuk / sesuaikan */}
      <AnimatePresence>
        {mode && selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-navy-900/40 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md
                bg-white rounded-xl shadow-2xl z-[81]"
            >
              {/* Header modal */}
              <div
                className="flex items-center justify-between px-6 py-4 rounded-t-xl"
                style={{ backgroundColor: '#234C6A' }}
              >
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {mode === 'masuk' ? 'Barang Masuk' : 'Sesuaikan Stok'}
                  </h2>
                  <p className="text-xs text-white/60 mt-0.5">{selected.nama}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Info stok saat ini */}
                <div className="flex items-center justify-between bg-slate-50 border border-line rounded-lg px-4 py-3">
                  <span className="text-xs text-muted">Stok saat ini</span>
                  <span className="text-sm font-bold text-ink">{selected.stok} {selected.satuan}</span>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
                    <span>⚠</span> {error}
                  </div>
                )}

                {/* Input qty / stok baru */}
                {mode === 'masuk' ? (
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Jumlah Masuk</label>
                    <input
                      type="number"
                      value={qty || ''}
                      onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                      autoFocus
                      className={inputCls}
                    />
                    {qty > 0 && (
                      <div className="mt-2 flex items-center justify-between text-xs text-muted bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                        <span>Stok setelah masuk</span>
                        <span className="font-bold text-emerald-700">{selected.stok + qty} {selected.satuan}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Stok Baru (hasil opname)</label>
                    <input
                      type="number"
                      value={stokBaru}
                      onChange={(e) => setStokBaru(parseInt(e.target.value) || 0)}
                      autoFocus
                      className={inputCls}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      <span className="text-muted">Selisih</span>
                      <span className={`font-bold ${stokBaru - selected.stok >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {stokBaru - selected.stok > 0 ? '+' : ''}{stokBaru - selected.stok} {selected.satuan}
                      </span>
                    </div>
                  </div>
                )}

                {/* Keterangan */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    Keterangan <span className="text-slate-400">(opsional)</span>
                  </label>
                  <input
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder={mode === 'masuk' ? 'Contoh: Restok dari supplier' : 'Contoh: Koreksi hasil opname'}
                    className={inputCls}
                  />
                </div>

                {/* Tombol */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-lg border border-line text-sm font-medium text-muted hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
                    style={{ backgroundColor: '#234C6A' }}
                    onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#1e435e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#234C6A')}
                  >
                    {saving
                      ? <span className="flex items-center justify-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Memproses...
                        </span>
                      : 'Simpan'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}