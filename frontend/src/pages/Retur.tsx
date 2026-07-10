import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, RotateCcw, CheckCircle2, AlertCircle,
  Receipt, ArrowLeftRight, Banknote,
} from 'lucide-react';
import {
  cariTransaksi, prosesRetur, getReturns,
  type CariResult, type ReturnRecord,
} from '../api/return';
import { rupiah, tanggal } from '../lib/format';
import { toast } from '../store/toast';

export default function Retur() {
  const [invoice, setInvoice] = useState('');
  const [hasil, setHasil] = useState<CariResult | null>(null);
  const [cariLoading, setCariLoading] = useState(false);
  const [cariError, setCariError] = useState('');

  const [qtyRetur, setQtyRetur] = useState<Record<string, number>>({});
  const [tipe, setTipe] = useState<'refund' | 'tukar'>('refund');
  const [alasan, setAlasan] = useState('');
  const [saving, setSaving] = useState(false);

  const [riwayat, setRiwayat] = useState<ReturnRecord[]>([]);

  async function loadRiwayat() {
    try {
      setRiwayat(await getReturns());
    } catch {
      // abaikan
    }
  }

  useEffect(() => {
    loadRiwayat();
  }, []);

  async function handleCari() {
    if (!invoice.trim()) return;
    setCariLoading(true);
    setCariError('');
    setHasil(null);
    setQtyRetur({});
    try {
      const data = await cariTransaksi(invoice.trim());
      setHasil(data);
    } catch (err: any) {
      setCariError(err.response?.data?.message ?? 'Transaksi tidak ditemukan.');
    } finally {
      setCariLoading(false);
    }
  }

  function setQty(productId: string, val: number, max: number) {
    const clamped = Math.max(0, Math.min(val, max));
    setQtyRetur((m) => ({ ...m, [productId]: clamped }));
  }

  const itemsDipilih = hasil
    ? hasil.items
        .filter((it) => (qtyRetur[it.product_id] ?? 0) > 0)
        .map((it) => ({ product_id: it.product_id, qty: qtyRetur[it.product_id] }))
    : [];

  const totalRetur = hasil
    ? hasil.items.reduce(
        (sum, it) => sum + (qtyRetur[it.product_id] ?? 0) * it.harga,
        0
      )
    : 0;

  async function handleProses() {
    if (!hasil || itemsDipilih.length === 0) return;
    setSaving(true);
    try {
      const res = await prosesRetur({
        sale_id: hasil.sale.id,
        tipe,
        alasan,
        items: itemsDipilih,
      });
      setHasil(null);
      setInvoice('');
      setQtyRetur({});
      setAlasan('');
      loadRiwayat();
      toast.success(
        `Retur berhasil: ${res.return_no}`,
        `${res.tipe === 'refund' ? 'Refund' : 'Tukar barang'} · ${rupiah(res.total_retur)}`
      );
    } catch (err: any) {
      toast.error('Gagal memproses retur', err.response?.data?.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Retur Barang</h1>
        <p className="text-sm text-muted mt-0.5">
          Cari transaksi lewat nomor nota, lalu proses retur.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCari()}
            placeholder="Nomor nota (INV-...)"
            className="w-full bg-white border border-line rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink
              placeholder:text-slate-400 transition
              focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10"
          />
        </div>
        <button
          onClick={handleCari}
          disabled={cariLoading}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition
            disabled:opacity-50"
          style={{ backgroundColor: '#234C6A' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e435e')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#234C6A')}
        >
          {cariLoading ? 'Mencari...' : 'Cari'}
        </button>
      </div>

      {/* Error cari */}
      <AnimatePresence>
        {cariError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700
              text-sm rounded-lg px-4 py-3"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {cariError}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Panel proses retur ── */}
        <div>
          <AnimatePresence mode="wait">
            {hasil ? (
              <motion.div
                key="hasil"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-line rounded-xl overflow-hidden"
              >
                {/* Info transaksi */}
                <div className="px-5 py-4 border-b border-line flex items-center justify-between"
                  style={{ backgroundColor: '#234C6A' }}>
                  <div>
                    <div className="text-sm font-bold text-white">{hasil.sale.invoice_no}</div>
                    <div className="text-xs text-white/60 mt-0.5">
                      {tanggal(hasil.sale.created_at)} · {hasil.sale.customer ?? 'Umum'}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {rupiah(hasil.sale.total)}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Item list */}
                  <div className="space-y-2">
                    {hasil.items.map((it) => (
                      <div
                        key={it.product_id}
                        className={`rounded-lg border p-3.5 transition ${
                          it.qty_sisa === 0
                            ? 'bg-slate-50 border-line opacity-50'
                            : 'bg-white border-line hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-semibold text-ink">{it.nama}</span>
                          <span className="text-xs text-muted ml-2 shrink-0">{rupiah(it.harga)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted">
                            Beli {it.qty_beli} · sisa retur: <strong>{it.qty_sisa}</strong>
                          </span>
                          {it.qty_sisa > 0 ? (
                            <input
                              type="number"
                              min={0}
                              max={it.qty_sisa}
                              value={qtyRetur[it.product_id] ?? 0}
                              onChange={(e) =>
                                setQty(it.product_id, parseInt(e.target.value) || 0, it.qty_sisa)
                              }
                              className="w-16 border border-line rounded-lg px-2 py-1 text-sm text-center text-ink
                                focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10"
                            />
                          ) : (
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                              habis diretur
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tipe retur */}
                  <div>
                    <label className="block text-xs font-medium text-muted mb-2">Tipe Retur</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { key: 'refund', label: 'Refund Uang', icon: Banknote },
                        { key: 'tukar', label: 'Tukar Barang', icon: ArrowLeftRight },
                      ] as const).map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setTipe(t.key)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
                            tipe === t.key
                              ? 'border-[#234C6A] text-[#234C6A] bg-[#234C6A]/5'
                              : 'border-line text-muted hover:border-slate-300 hover:text-ink'
                          }`}
                        >
                          <t.icon className="w-4 h-4" />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alasan */}
                  <div>
                    <label className="block text-xs font-medium text-muted mb-2">
                      Alasan <span className="text-slate-400">(opsional)</span>
                    </label>
                    <input
                      value={alasan}
                      onChange={(e) => setAlasan(e.target.value)}
                      placeholder="Contoh: Barang tidak sesuai"
                      className="w-full bg-white border border-line rounded-lg px-3 py-2.5 text-sm text-ink
                        placeholder:text-slate-400 transition
                        focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10"
                    />
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between py-3 border-t border-line">
                    <span className="text-sm text-muted">Total retur</span>
                    <span className="text-base font-bold text-ink">{rupiah(totalRetur)}</span>
                  </div>

                  {/* Tombol */}
                  <button
                    onClick={handleProses}
                    disabled={saving || itemsDipilih.length === 0}
                    className="w-full flex items-center justify-center gap-2 text-white font-semibold
                      rounded-lg py-2.5 text-sm transition disabled:opacity-40"
                    style={{ backgroundColor: '#234C6A' }}
                    onMouseEnter={(e) => !saving && itemsDipilih.length > 0 && (e.currentTarget.style.backgroundColor = '#1e435e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#234C6A')}
                  >
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    {saving ? 'Memproses...' : 'Proses Retur'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50"
              >
                <div className="w-12 h-12 rounded-full bg-white border border-line flex items-center justify-center mb-3 shadow-sm">
                  <Receipt className="w-5 h-5 text-muted" />
                </div>
                <p className="text-sm font-medium text-ink">Cari nomor nota</p>
                <p className="text-xs text-muted mt-1">Masukkan nomor nota di atas untuk memulai retur.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Riwayat retur ── */}
        <div>
          <div className="bg-white border border-line rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-muted" />
                <h2 className="text-sm font-semibold text-ink">Riwayat Retur</h2>
              </div>
              <span className="text-xs text-muted">{riwayat.length} retur</span>
            </div>

            {riwayat.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-muted">Belum ada retur.</p>
              </div>
            ) : (
              <div className="divide-y divide-line max-h-[60vh] overflow-y-auto">
                {riwayat.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: r.tipe === 'refund' ? '#234C6A' : undefined }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          r.tipe === 'refund'
                            ? 'bg-[#234C6A] text-white'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {r.tipe === 'refund'
                          ? <Banknote className="w-4 h-4" />
                          : <ArrowLeftRight className="w-4 h-4" />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink">{r.return_no}</div>
                        <div className="text-xs text-muted truncate">
                          {r.sale?.invoice_no} · {r.tipe === 'refund' ? 'Refund' : 'Tukar'} · {tanggal(r.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-ink shrink-0 ml-2">
                      {rupiah(r.total_retur)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}