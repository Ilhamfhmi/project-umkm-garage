import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, X, Package,
  ChevronDown, Droplets, Circle, Zap, Tag,
} from 'lucide-react';
import { getCategories } from '../api/category';
import { getBrands, type Brand } from '../api/brand';
import client from '../api/client';
import { useAuth } from '../store/auth';
import { can } from '../lib/permissions';
import { toast } from '../store/toast';
import { confirmDialog } from '../store/confirm';
import type { Category } from '../types';

const inputCls = `w-full bg-white border border-line rounded-lg px-3 py-2.5 text-sm text-ink
  placeholder:text-slate-400 transition
  focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10`;

const CAT_CONFIG: Record<string, { color: string; light: string; icon: any }> = {
  'Oli Mesin': { color: '#234C6A', light: '#EEF3F8', icon: Droplets },
  'Oli Gear':  { color: '#0F766E', light: '#F0FDFA', icon: Zap      },
  'Ban':       { color: '#7C3AED', light: '#F5F3FF', icon: Circle   },
  'ATF & CVT': { color: '#B45309', light: '#FFFBEB', icon: Tag      },
};

const DEFAULT_CFG = { color: '#234C6A', light: '#EEF3F8', icon: Package };

async function createBrand(payload: { category_id: string; nama: string; is_active: boolean }) {
  const { data } = await client.post('/brands', payload);
  return data;
}
async function updateBrand(id: string, payload: { nama: string; is_active: boolean }) {
  const { data } = await client.put(`/brands/${id}`, payload);
  return data;
}
async function deleteBrand(id: string) {
  await client.delete(`/brands/${id}`);
}

export default function Kategori() {
  const role = useAuth((s) => s.user?.role);
  const izin = can(role);

  const [categories,   setCategories]   = useState<Category[]>([]);
  const [brands,       setBrands]       = useState<Brand[]>([]);
  const [activeCatId,  setActiveCatId]  = useState<string>('');
  const [loading,      setLoading]      = useState(true);
  const [loadingBrand, setLoadingBrand] = useState(false);

  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState<Brand | null>(null);
  const [formNama,   setFormNama]   = useState('');
  const [formCatId,  setFormCatId]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setActiveCatId(cats[0].id);
        setFormCatId(cats[0].id);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeCatId) return;
    setLoadingBrand(true);
    getBrands(activeCatId).then(setBrands).finally(() => setLoadingBrand(false));
  }, [activeCatId]);

  function refreshBrands() {
    if (!activeCatId) return;
    getBrands(activeCatId).then(setBrands);
  }

  function openCreate() {
    setEditing(null);
    setFormNama('');
    setFormCatId(activeCatId);
    setError('');
    setModalOpen(true);
  }

  function openEdit(b: Brand) {
    setEditing(b);
    setFormNama(b.nama);
    setFormCatId(activeCatId);
    setError('');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!formNama.trim()) { setError('Nama merek wajib diisi.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateBrand(editing.id, { nama: formNama, is_active: true });
        toast.success('Merek diperbarui', `${formNama} berhasil disimpan.`);
      } else {
        await createBrand({ category_id: formCatId, nama: formNama, is_active: true });
        toast.success('Merek ditambahkan', `${formNama} berhasil ditambahkan.`);
      }
      setModalOpen(false);
      refreshBrands();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(b: Brand) {
    const ok = await confirmDialog({
      title: `Hapus merek "${b.nama}"?`,
      message: 'Produk dengan merek ini tidak akan terhapus, hanya mereknya.',
      confirmText: 'Ya, hapus',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteBrand(b.id);
      toast.success('Merek dihapus', `${b.nama} berhasil dihapus.`);
      refreshBrands();
    } catch (err: any) {
      toast.error('Gagal menghapus', err.response?.data?.message);
    }
  }

  const activeCat = categories.find((c) => c.id === activeCatId);
  const cfg       = activeCat ? (CAT_CONFIG[activeCat.nama] ?? DEFAULT_CFG) : DEFAULT_CFG;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Merek</h1>
          <p className="text-sm text-muted mt-0.5">Kelola merek produk per kategori.</p>
        </div>
        {izin.kelolaKategori && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="flex items-center gap-2 text-white font-semibold rounded-lg px-4 py-2.5 text-sm shadow-md transition"
            style={{ backgroundColor: cfg.color }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <Plus className="w-4 h-4" />
            Tambah Merek
          </motion.button>
        )}
      </div>

      {/* ── Tab Kategori ── */}
      {loading ? (
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => {
            const c   = CAT_CONFIG[cat.nama] ?? DEFAULT_CFG;
            const Icon = c.icon;
            const active = activeCatId === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveCatId(cat.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                  font-semibold transition-all whitespace-nowrap border-2 ${
                  active
                    ? 'text-white border-transparent shadow-md'
                    : 'bg-white border-line text-muted hover:border-slate-300 hover:text-ink'
                }`}
                style={active ? { backgroundColor: c.color } : {}}
              >
                <Icon className="w-4 h-4" />
                {cat.nama}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* ── Banner kategori aktif ── */}
      {activeCat && !loadingBrand && (
        <motion.div
          key={activeCatId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{ backgroundColor: cfg.light }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: cfg.color }}
          >
            <cfg.icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-ink">{activeCat.nama}</h2>
            <p className="text-xs text-muted mt-0.5">
              {brands.length} merek terdaftar ·{' '}
              {brands.reduce((s, b) => s + (b.products_count ?? 0), 0)} total produk
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Grid Merek ── */}
      {loadingBrand ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-line rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full w-full" />
            </div>
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: cfg.light }}
          >
            <Package className="w-7 h-7" style={{ color: cfg.color }} />
          </div>
          <p className="text-sm font-semibold text-ink">Belum ada merek</p>
          <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
            {izin.kelolaKategori
              ? `Tambah merek baru untuk kategori ${activeCat?.nama}.`
              : 'Merek akan muncul di sini.'}
          </p>
          {izin.kelolaKategori && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                font-semibold text-white shadow-sm"
              style={{ backgroundColor: cfg.color }}
            >
              <Plus className="w-4 h-4" />
              Tambah Merek
            </motion.button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((b, i) => {
            const pct = Math.min(100, ((b.products_count ?? 0) / 20) * 100);
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group bg-white border-2 border-line rounded-2xl p-5
                  hover:border-slate-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center
                        text-xl font-black text-white shrink-0
                        group-hover:scale-105 transition-transform duration-200"
                      style={{ backgroundColor: cfg.color }}
                    >
                      {b.nama.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-ink truncate">{b.nama}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ backgroundColor: cfg.light, color: cfg.color }}
                        >
                          {activeCat?.nama}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Aksi */}
                  {izin.kelolaKategori && (
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(b)}
                        className="p-1.5 rounded-lg text-muted hover:bg-slate-100 hover:text-[#234C6A] transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b)}
                        className="p-1.5 rounded-lg text-muted hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Jumlah produk + progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Jumlah produk</span>
                    <span className="font-bold text-ink">{b.products_count ?? 0}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.04 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: cfg.color }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
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
                style={{ backgroundColor: cfg.color }}
              >
                <h2 className="text-sm font-bold text-white">
                  {editing ? 'Edit Merek' : 'Tambah Merek Baru'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2.5 bg-red-50 border border-red-200
                    text-red-700 text-sm rounded-lg px-3 py-2.5">
                    <span>⚠</span> {error}
                  </div>
                )}

                {/* Pilih kategori (hanya saat tambah baru) */}
                {!editing && (
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Kategori</label>
                    <div className="relative">
                      <select
                        value={formCatId}
                        onChange={(e) => setFormCatId(e.target.value)}
                        className={`${inputCls} appearance-none pr-8`}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.nama}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4
                        text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Nama merek */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    Nama Merek <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    autoFocus
                    placeholder="Contoh: Castrol, Shell, Yamalube"
                    className={inputCls}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                </div>

                {/* Tombol */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-line text-sm
                      font-medium text-muted hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white
                      transition disabled:opacity-50"
                    style={{ backgroundColor: cfg.color }}
                    onMouseEnter={(e) => !saving && (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
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