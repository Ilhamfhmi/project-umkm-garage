import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, RotateCcw, CheckCircle, AlertCircle, Receipt,
} from 'lucide-react';
import {
  cariTransaksi, prosesRetur, getReturns,
  type CariResult, type ReturnRecord,
} from '../api/return';
import { rupiah, tanggal } from '../lib/format';

export default function Retur() {
  const [invoice, setInvoice] = useState('');
  const [hasil, setHasil] = useState<CariResult | null>(null);
  const [cariLoading, setCariLoading] = useState(false);
  const [cariError, setCariError] = useState('');

  // qty retur per produk
  const [qtyRetur, setQtyRetur] = useState<Record<string, number>>({});
  const [tipe, setTipe] = useState<'refund' | 'tukar'>('refund');
  const [alasan, setAlasan] = useState('');
  const [saving, setSaving] = useState(false);
  const [sukses, setSukses] = useState<ReturnRecord | null>(null);

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
    setSukses(null);
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
      setSukses(res);
      setHasil(null);
      setInvoice('');
      setQtyRetur({});
      setAlasan('');
      loadRiwayat();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Gagal memproses retur.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">Retur Barang</h1>
        <p className="text-sm text-zinc-500">Cari transaksi lewat nomor nota, lalu proses retur</p>
      </div>

      {/* Sukses */}
      {sukses && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4 flex items-center gap-3"
        >
          <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-green-400">Retur berhasil: {sukses.return_no}</div>
            <div className="text-xs text-zinc-400">
              {sukses.tipe === 'refund' ? 'Refund' : 'Tukar barang'} · {rupiah(sukses.total_retur)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Cari invoice */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCari()}
            placeholder="Nomor nota (INV-...)"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
        <button
          onClick={handleCari}
          disabled={cariLoading}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg px-6 py-2 text-sm transition disabled:opacity-50"
        >
          {cariLoading ? 'Mencari...' : 'Cari'}
        </button>
      </div>

      {cariError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {cariError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel proses retur */}
        <div>
          {hasil ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800">
                <div>
                  <div className="text-sm font-semibold">{hasil.sale.invoice_no}</div>
                  <div className="text-xs text-zinc-500">
                    {tanggal(hasil.sale.created_at)} · {hasil.sale.customer ?? 'Umum'}
                  </div>
                </div>
                <div className="text-sm font-semibold text-amber-400">
                  {rupiah(hasil.sale.total)}
                </div>
              </div>

              {/* Item yang bisa diretur */}
              <div className="space-y-2 mb-4">
                {hasil.items.map((it) => (
                  <div
                    key={it.product_id}
                    className={`rounded-lg p-3 border ${
                      it.qty_sisa === 0
                        ? 'bg-zinc-950/50 border-zinc-800 opacity-50'
                        : 'bg-zinc-950 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{it.nama}</span>
                      <span className="text-xs text-zinc-500">{rupiah(it.harga)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">
                        Beli {it.qty_beli} · sisa bisa retur: {it.qty_sisa}
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
                          className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:border-amber-500"
                        />
                      ) : (
                        <span className="text-xs text-zinc-600">habis diretur</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tipe retur */}
              <div className="mb-3">
                <label className="block text-xs text-zinc-400 mb-1">Tipe Retur</label>
                <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                  {(['refund', 'tukar'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipe(t)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition ${
                        tipe === t ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t === 'refund' ? 'Refund Uang' : 'Tukar Barang'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs text-zinc-400 mb-1">Alasan (opsional)</label>
                <input
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder="Contoh: Barang tidak sesuai"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between mb-3 text-sm">
                <span className="text-zinc-400">Total retur</span>
                <span className="font-bold text-amber-400">{rupiah(totalRetur)}</span>
              </div>

              <button
                onClick={handleProses}
                disabled={saving || itemsDipilih.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg py-2.5 text-sm transition disabled:opacity-40"
              >
                <RotateCcw className="w-4 h-4" />
                {saving ? 'Memproses...' : 'Proses Retur'}
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Cari nomor nota untuk mulai retur.</p>
            </div>
          )}
        </div>

        {/* Riwayat retur */}
        <div>
          <h2 className="text-sm font-semibold mb-2 text-zinc-400">Riwayat Retur</h2>
          {riwayat.length === 0 ? (
            <p className="text-sm text-zinc-500">Belum ada retur.</p>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {riwayat.map((r) => (
                <div
                  key={r.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{r.return_no}</div>
                    <div className="text-xs text-zinc-500">
                      {r.sale?.invoice_no} · {r.tipe === 'refund' ? 'Refund' : 'Tukar'} · {tanggal(r.created_at)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-amber-400 shrink-0 ml-2">
                    {rupiah(r.total_retur)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}