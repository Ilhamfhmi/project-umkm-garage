import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Search, Users, Phone, MapPin } from 'lucide-react';
import {
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  type Customer, type CustomerPayload,
} from '../api/customer';
import { toast } from '../store/toast';
import { confirmDialog } from '../store/confirm';

const emptyForm: CustomerPayload = {
  nama: '',
  no_hp: '',
  alamat: '',
  tipe: 'umum',
};

const inputCls = `w-full bg-white border border-line rounded-lg px-3 py-2.5 text-sm text-ink
  placeholder:text-slate-400 transition
  focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10`;

export default function Pelanggan() {
  const [items, setItems] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      getCustomers(search)
        .then(setItems)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  function refresh() {
    getCustomers(search).then(setItems);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      nama: c.nama,
      no_hp: c.no_hp ?? '',
      alamat: c.alamat ?? '',
      tipe: c.tipe,
    });
    setError('');
    setModalOpen(true);
  }

  function setField<K extends keyof CustomerPayload>(key: K, value: CustomerPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.nama.trim()) {
      setError('Nama pelanggan wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateCustomer(editing.id, form);
        toast.success('Pelanggan diperbarui', `${form.nama} berhasil disimpan.`);
      } else {
        await createCustomer(form);
        toast.success('Pelanggan ditambahkan', `${form.nama} berhasil ditambahkan.`);
      }
      setModalOpen(false);
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Customer) {
    const ok = await confirmDialog({
      title: `Hapus pelanggan "${c.nama}"?`,
      message: 'Data pelanggan yang dihapus tidak dapat dikembalikan.',
      confirmText: 'Ya, hapus',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteCustomer(c.id);
      toast.success('Pelanggan dihapus', `${c.nama} berhasil dihapus.`);
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
          <h1 className="text-xl font-bold text-ink">Pelanggan</h1>
          <p className="text-sm text-muted mt-0.5">Kelola data pelanggan umum & mitra.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition"
          style={{ backgroundColor: '#234C6A' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e435e')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#234C6A')}
        >
          <Plus className="w-4 h-4" />
          Tambah Pelanggan
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau no. HP..."
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
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-100 rounded w-3/4 mb-1.5" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50">
          <div className="w-12 h-12 rounded-full bg-white border border-line flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Users className="w-5 h-5 text-muted" />
          </div>
          <p className="text-sm font-medium text-ink">Belum ada pelanggan</p>
          <p className="text-xs text-muted mt-1">Klik "Tambah Pelanggan" untuk memulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c, i) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white border border-line rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar inisial */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: '#234C6A' }}
                  >
                    {c.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink truncate">{c.nama}</h3>
                    <span className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-md font-medium capitalize
                      ${c.tipe === 'mitra'
                        ? 'bg-[#234C6A]/10 text-[#234C6A]'
                        : 'bg-slate-100 text-muted'}`}
                    >
                      {c.tipe}
                    </span>
                  </div>
                </div>

                {/* Tombol aksi */}
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg text-muted hover:bg-slate-100 hover:text-[#234C6A] transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-1.5 rounded-lg text-muted hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Info kontak */}
              <div className="space-y-1.5 pt-3 border-t border-line">
                {c.no_hp ? (
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {c.no_hp}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    Tidak ada no. HP
                  </div>
                )}
                {c.alamat ? (
                  <div className="flex items-start gap-2 text-xs text-muted">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.alamat}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    Tidak ada alamat
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
                  {editing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
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
                    <span>⚠</span> {error}
                  </div>
                )}

                {/* Nama */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">
                    Nama <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.nama}
                    onChange={(e) => setField('nama', e.target.value)}
                    autoFocus
                    placeholder="Nama lengkap pelanggan"
                    className={inputCls}
                  />
                </div>

                {/* No HP */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">No. HP</label>
                  <input
                    value={form.no_hp ?? ''}
                    onChange={(e) => setField('no_hp', e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className={inputCls}
                  />
                </div>

                {/* Tipe */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Tipe Pelanggan</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['umum', 'mitra'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setField('tipe', t)}
                        className={`py-2.5 rounded-lg border text-sm font-medium capitalize transition ${
                          form.tipe === t
                            ? 'border-[#234C6A] text-[#234C6A] bg-[#234C6A]/5'
                            : 'border-line text-muted hover:border-slate-300 hover:text-ink'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alamat */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Alamat</label>
                  <textarea
                    value={form.alamat ?? ''}
                    onChange={(e) => setField('alamat', e.target.value)}
                    rows={2}
                    placeholder="Alamat lengkap..."
                    className={`${inputCls} resize-none`}
                  />
                </div>

                {/* Tombol */}
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