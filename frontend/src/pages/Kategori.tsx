import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Tags } from 'lucide-react';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
} from '../api/category';
import { useAuth } from '../store/auth';
import { can } from '../lib/permissions';
import { toast } from '../store/toast';
import { confirmDialog } from '../store/confirm';
import type { Category } from '../types';

const inputCls = `w-full bg-white border border-line rounded-lg px-3 py-2.5 text-sm text-ink
  placeholder:text-slate-400 transition
  focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10`;

export default function Kategori() {
  const role = useAuth((s) => s.user?.role);
  const izin = can(role);

  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      setItems(await getCategories());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setNama('');
    setDeskripsi('');
    setError('');
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setNama(cat.nama);
    setDeskripsi(cat.deskripsi ?? '');
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!nama.trim()) {
      setError('Nama kategori wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateCategory(editing.id, { nama, deskripsi });
        toast.success('Kategori diperbarui', `${nama} berhasil disimpan.`);
      } else {
        await createCategory({ nama, deskripsi });
        toast.success('Kategori ditambahkan', `${nama} berhasil ditambahkan.`);
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    const ok = await confirmDialog({
      title: `Hapus kategori "${cat.nama}"?`,
      message: 'Produk dalam kategori ini tidak akan terhapus, hanya kategorinya.',
      confirmText: 'Ya, hapus',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteCategory(cat.id);
      toast.success('Kategori dihapus', `${cat.nama} berhasil dihapus.`);
      load();
    } catch (err: any) {
      toast.error('Gagal menghapus', err.response?.data?.message);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Kategori</h1>
          <p className="text-sm text-muted mt-0.5">Kelola kategori produk.</p>
        </div>
        {izin.kelolaKategori && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition"
            style={{ backgroundColor: '#234C6A' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e435e')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#234C6A')}
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-line rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-3/4 mb-4" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50">
          <div className="w-12 h-12 rounded-full bg-white border border-line flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Tags className="w-5 h-5 text-muted" />
          </div>
          <p className="text-sm font-medium text-ink">Belum ada kategori</p>
          <p className="text-xs text-muted mt-1">
            {izin.kelolaKategori ? 'Klik "Tambah Kategori" untuk memulai.' : 'Kategori akan muncul di sini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-line rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                {/* Ikon & konten */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white mt-0.5"
                    style={{ backgroundColor: '#234C6A' }}
                  >
                    <Tags className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink truncate">{cat.nama}</h3>
                    {cat.deskripsi && (
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{cat.deskripsi}</p>
                    )}
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-muted font-medium">
                      {cat.products_count ?? 0} produk
                    </span>
                  </div>
                </div>

                {/* Tombol aksi */}
                {izin.kelolaKategori && (
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 rounded-lg text-muted hover:bg-slate-100 hover:text-[#234C6A] transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 rounded-lg text-muted hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
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
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md
                bg-white rounded-xl shadow-2xl z-[81]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                <h2 className="text-base font-semibold text-ink">
                  {editing ? 'Edit Kategori' : 'Tambah Kategori'}
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
                  <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
                    <span>⚠</span>
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    Nama Kategori <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    autoFocus
                    placeholder="Contoh: Oli, Sparepart"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    Deskripsi <span className="text-slate-400">(opsional)</span>
                  </label>
                  <textarea
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    rows={3}
                    placeholder="Deskripsi singkat kategori ini..."
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div className="flex gap-2 pt-2">
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