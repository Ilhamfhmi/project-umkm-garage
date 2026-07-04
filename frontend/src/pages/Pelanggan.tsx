import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Search, Users, Phone, MapPin } from 'lucide-react';
import {
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  type Customer, type CustomerPayload,
} from '../api/customer';

const emptyForm: CustomerPayload = {
  nama: '',
  no_hp: '',
  alamat: '',
  tipe: 'umum',
};

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
      } else {
        await createCustomer(form);
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
    if (!confirm(`Hapus pelanggan "${c.nama}"?`)) return;
    try {
      await deleteCustomer(c.id);
      refresh();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Gagal menghapus.');
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold">Pelanggan</h1>
          <p className="text-sm text-zinc-500">Kelola data pelanggan umum & mitra</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg px-4 py-2 text-sm transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Pelanggan
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau no. HP..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
        />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Memuat...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Belum ada pelanggan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((c) => (
            <motion.div
              key={c.id}
              layout
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold truncate">{c.nama}</h3>
                  <span
                    className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full capitalize ${
                      c.tipe === 'mitra'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {c.tipe}
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-amber-400"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-xs text-zinc-400">
                {c.no_hp && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-600" />
                    {c.no_hp}
                  </div>
                )}
                {c.alamat && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.alamat}</span>
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
                  {editing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
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
                  <label className="block text-xs text-zinc-400 mb-1">Nama *</label>
                  <input
                    value={form.nama}
                    onChange={(e) => setField('nama', e.target.value)}
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">No. HP</label>
                  <input
                    value={form.no_hp ?? ''}
                    onChange={(e) => setField('no_hp', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Tipe</label>
                  <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                    {(['umum', 'mitra'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setField('tipe', t)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition ${
                          form.tipe === t
                            ? 'bg-amber-500 text-zinc-950'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Alamat</label>
                  <textarea
                    value={form.alamat ?? ''}
                    onChange={(e) => setField('alamat', e.target.value)}
                    rows={2}
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