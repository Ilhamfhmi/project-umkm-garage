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
import { toast } from '../store/toast';
import { confirmDialog } from '../store/confirm';
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

const inputCls = `w-full bg-white border border-line rounded-lg px-3 py-2.5 text-sm text-ink
  placeholder:text-slate-400 transition
  focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10`;

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

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

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
        toast.success('Produk diperbarui', `${form.nama} berhasil disimpan.`);
      } else {
        await createProduct(payload);
        toast.success('Produk ditambahkan', `${form.nama} berhasil ditambahkan.`);
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
    const ok = await confirmDialog({
      title: `Hapus produk "${p.nama}"?`,
      message: 'Produk yang dihapus tidak dapat dikembalikan.',
      confirmText: 'Ya, hapus',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteProduct(p.id);
      toast.success('Produk dihapus', `${p.nama} berhasil dihapus.`);
      refresh();
    } catch (err: any) {
      toast.error('Gagal menghapus', err.response?.data?.message);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">Produk</h1>
          <p className="text-sm text-muted mt-0.5">Kelola data produk & harga.</p>
        </div>
        {izin.kelolaProduk && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition"
            style={{ backgroundColor: '#234C6A' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e435e')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#234C6A')}
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        )}
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

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-line rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded" />
                <div className="h-3 bg-slate-100 rounded" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50">
          <div className="w-12 h-12 rounded-full bg-white border border-line flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Package className="w-5 h-5 text-muted" />
          </div>
          <p className="text-sm font-medium text-ink">Belum ada produk</p>
          <p className="text-xs text-muted mt-1">
            {izin.kelolaProduk ? 'Klik "Tambah Produk" untuk memulai.' : 'Produk akan muncul di sini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white border border-line rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink truncate">{p.nama}</h3>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-muted font-medium">
                    {p.category?.nama ?? 'Tanpa kategori'}
                  </span>
                </div>
                {izin.kelolaProduk && (
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 rounded-lg text-muted hover:bg-slate-100 hover:text-[#234C6A] transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1.5 rounded-lg text-muted hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-3 border-t border-line">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Harga umum</span>
                  <span className="font-semibold text-ink">{rupiah(p.harga_umum)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Harga mitra</span>
                  <span className="font-medium text-ink">{rupiah(p.harga_mitra)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Stok</span>
                  <span className={`font-semibold ${
                    p.stok <= p.stok_minimum && p.stok_minimum > 0
                      ? 'text-amber-600'
                      : 'text-ink'
                  }`}>
                    {p.stok} {p.satuan}
                    {p.stok <= p.stok_minimum && p.stok_minimum > 0 && (
                      <span className="ml-1 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
                        menipis
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-navy-900/40 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg
                bg-white rounded-xl shadow-2xl z-[81] max-h-[90vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-line sticky top-0 bg-white rounded-t-xl">
                <h2 className="text-base font-semibold text-ink">
                  {editing ? 'Edit Produk' : 'Tambah Produk'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    {error}
                  </div>
                )}

                {/* Nama */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.nama}
                    onChange={(e) => setField('nama', e.target.value)}
                    autoFocus
                    placeholder="Contoh: Oli Mesin 1L"
                    className={inputCls}
                  />
                </div>

                {/* Kategori & Satuan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Kategori</label>
                    <select
                      value={form.category_id ?? ''}
                      onChange={(e) => setField('category_id', e.target.value || null)}
                      className={inputCls}
                    >
                      <option value="">Tanpa kategori</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Satuan</label>
                    <input
                      value={form.satuan}
                      onChange={(e) => setField('satuan', e.target.value)}
                      placeholder="pcs, botol, liter"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Harga */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Harga</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Umum', key: 'harga_umum' as const },
                      { label: 'Mitra', key: 'harga_mitra' as const },
                      { label: 'Beli', key: 'harga_beli' as const },
                    ].map((h) => (
                      <div key={h.key}>
                        <label className="block text-[10px] text-muted mb-1">{h.label}</label>
                        <input
                          type="number"
                          value={form[h.key] || ''}
                          onChange={(e) => setField(h.key, parseFloat(e.target.value) || 0)}
                          className={inputCls}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stok */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Stok</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Stok saat ini', key: 'stok' as const, isInt: true },
                      { label: 'Stok minimum', key: 'stok_minimum' as const, isInt: true },
                    ].map((s) => (
                      <div key={s.key}>
                        <label className="block text-[10px] text-muted mb-1">{s.label}</label>
                        <input
                          type="number"
                          value={form[s.key] || ''}
                          onChange={(e) => setField(s.key, parseInt(e.target.value) || 0)}
                          className={inputCls}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    SKU <span className="text-slate-400">(opsional)</span>
                  </label>
                  <input
                    value={form.sku ?? ''}
                    onChange={(e) => setField('sku', e.target.value)}
                    placeholder="Kode produk unik"
                    className={inputCls}
                  />
                </div>

                {/* Submit */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setModalOpen(false)}
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
                          Menyimpan...
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