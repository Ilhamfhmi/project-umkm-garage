import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Tags } from 'lucide-react';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
} from '../api/category';
import { useAuth } from '../store/auth';
import { can } from '../lib/permissions';
import type { Category } from '../types';

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

  useEffect(() => {
    load();
  }, []);

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
      } else {
        await createCategory({ nama, deskripsi });
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
    if (!confirm(`Hapus kategori "${cat.nama}"?`)) return;
    try {
      await deleteCategory(cat.id);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Gagal menghapus.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Kategori</h1>
          <p className="text-sm text-zinc-500">Kelola kategori produk</p>
        </div>
        {izin.kelolaKategori && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg px-4 py-2 text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Memuat...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Tags className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Belum ada kategori.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((cat) => (
            <div
              key={cat.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">{cat.nama}</h3>
                {cat.deskripsi && (
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{cat.deskripsi}</p>
                )}
                <p className="text-[11px] text-zinc-600 mt-1">
                  {cat.products_count ?? 0} produk
                </p>
              </div>
              {izin.kelolaKategori && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-amber-400"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
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
                  {editing ? 'Edit Kategori' : 'Tambah Kategori'}
                </h2>
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
                  <label className="block text-xs text-zinc-400 mb-1">Nama Kategori</label>
                  <input
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    placeholder="Contoh: Oli, Sparepart"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Deskripsi (opsional)</label>
                  <textarea
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
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