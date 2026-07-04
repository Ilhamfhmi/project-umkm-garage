import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Search, Package } from 'lucide-react';
import {
  searchProducts, createProduct, updateProduct, deleteProduct,
  type ProductPayload,
} from '../api/product';
import { getCategories } from '../api/category';
import { rupiah } from '../lib/format';
import { useAuth } from '../store/auth';
import { can } from '../lib/permissions';
import type { Product, Category } from '../types';

const emptyForm: ProductPayload = {
  nama: '',
  category_id: null,
  sku: '',
  satuan: 'pcs',
  stok: 0,
  stok_minimum: 0,
  harga_beli: 0,
  harga_umum: 0,
  harga_mitra: 0,
  is_active: true,
};

export default function Produk() {
  const role = useAuth((s) => s.user?.role);
  const izin = can(role);

  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load kategori sekali saja
  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  // Load produk dengan debounce saat search berubah
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      searchProducts(search)
        .then(setItems)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  function refresh() {
    searchProducts(search).then(setItems);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      nama: p.nama,
      category_id: p.category_id,
      sku: p.sku ?? '',
      satuan: p.satuan,
      stok: p.stok,
      stok_minimum: p.stok_minimum,
      harga_beli: parseFloat(p.harga_beli),
      harga_umum: parseFloat(p.harga_umum),
      harga_mitra: parseFloat(p.harga_mitra),
      is_active: p.is_active,
    });
    setError('');
    setModalOpen(true);
  }

  function setField<K extends keyof ProductPayload>(key: K, value: ProductPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.nama.trim()) {
      setError('Nama produk wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, category_id: form.category_id || null };
      if (editing) {
        await updateProduct(editing.id, payload);
      } else {
        await createProduct(payload);
      }
      setModalOpen(false);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan produk.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Hapus produk "${p.nama}"?`)) return;
    try {
      await deleteProduct(p.id);
      refresh();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Gagal menghapus.');
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold">Produk</h1>
          <p className="text-sm text-zinc-500">Kelola data produk & harga</p>
        </div>
        {izin.kelolaProduk && (
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg px-4 py-2 text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        )}
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

      {loading ? (
        <p className="text-sm text-zinc-500">Memuat...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Belum ada produk.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((p) => (
            <motion.div
              key={p.id}
              layout
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold truncate">{p.nama}</h3>
                  <p className="text-xs text-zinc-500">{p.category?.nama ?? 'Tanpa kategori'}</p>
                </div>
                {izin.kelolaProduk && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-amber-400"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Harga umum</span>
                  <span className="text-amber-400 font-medium">{rupiah(p.harga_umum)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Harga mitra</span>
                  <span className="text-zinc-300">{rupiah(p.harga_mitra)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Stok</span>
                  <span className={p.stok <= p.stok_minimum && p.stok_minimum > 0 ? 'text-red-400' : 'text-zinc-300'}>
                    {p.stok} {p.satuan}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal form */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl z-50 p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{editing ? 'Edit Produk' : 'Tambah Produk'}</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-3">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Nama Produk *</label>
                  <input
                    value={form.nama}
                    onChange={(e) => setField('nama', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Kategori</label>
                    <select
                      value={form.category_id ?? ''}
                      onChange={(e) => setField('category_id', e.target.value || null)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Tanpa kategori</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Satuan</label>
                    <input
                      value={form.satuan}
                      onChange={(e) => setField('satuan', e.target.value)}
                      placeholder="pcs, botol, liter"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Harga Umum *</label>
                    <input
                      type="number"
                      value={form.harga_umum || ''}
                      onChange={(e) => setField('harga_umum', parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Harga Mitra *</label>
                    <input
                      type="number"
                      value={form.harga_mitra || ''}
                      onChange={(e) => setField('harga_mitra', parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Harga Beli</label>
                    <input
                      type="number"
                      value={form.harga_beli || ''}
                      onChange={(e) => setField('harga_beli', parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Stok</label>
                    <input
                      type="number"
                      value={form.stok || ''}
                      onChange={(e) => setField('stok', parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Stok Min</label>
                    <input
                      type="number"
                      value={form.stok_minimum || ''}
                      onChange={(e) => setField('stok_minimum', parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">SKU (opsional)</label>
                  <input
                    value={form.sku ?? ''}
                    onChange={(e) => setField('sku', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg py-2.5 text-sm transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}