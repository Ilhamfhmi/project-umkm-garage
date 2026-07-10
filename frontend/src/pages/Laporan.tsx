import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Receipt, Tag, Trophy,
  Calendar, Clock, ArrowDownRight,
} from 'lucide-react';
import {
  getLaporanPenjualan, getProdukTerlaris,
  type LaporanPenjualan, type ProdukTerlaris,
} from '../api/report';
import { rupiah, tanggal } from '../lib/format';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

const inputCls = `w-full bg-white border border-line rounded-lg pl-10 pr-3 py-2.5 text-sm text-ink
  placeholder:text-slate-400 transition
  focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10`;

export default function Laporan() {
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(todayStr());
  const [laporan, setLaporan] = useState<LaporanPenjualan | null>(null);
  const [terlaris, setTerlaris] = useState<ProdukTerlaris[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [lap, ter] = await Promise.all([
        getLaporanPenjualan(from, to),
        getProdukTerlaris(from, to),
      ]);
      setLaporan(lap);
      setTerlaris(ter);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxTerlaris = terlaris.length > 0 ? terlaris[0].total_terjual : 1;

  const cards = laporan
    ? [
        {
          label: 'Total Omzet',
          value: rupiah(laporan.ringkasan.total_omzet),
          sub: 'Bersih setelah retur',
          icon: TrendingUp,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
        },
        {
          label: 'Jumlah Transaksi',
          value: String(laporan.ringkasan.jumlah_transaksi),
          sub: 'Total transaksi selesai',
          icon: Receipt,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
        },
        {
          label: 'Total Diskon',
          value: rupiah(laporan.ringkasan.total_diskon),
          sub: 'Diskon yang diberikan',
          icon: Tag,
          color: 'text-violet-600',
          bg: 'bg-violet-50',
        },
        {
          label: 'Total Retur',
          value: rupiah(laporan.ringkasan.total_retur ?? 0),
          sub: 'Nilai barang diretur',
          icon: ArrowDownRight,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
        },
      ]
    : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Laporan</h1>
        <p className="text-sm text-muted mt-0.5">Analisis penjualan per periode.</p>
      </div>

      {/* Filter periode */}
      <div className="bg-white border border-line rounded-xl p-5 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-muted mb-1.5">Dari Tanggal</label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-muted mb-1.5">Sampai Tanggal</label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60 shrink-0"
          style={{ backgroundColor: '#234C6A' }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1e435e')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#234C6A')}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Memuat...
            </span>
          ) : 'Tampilkan'}
        </button>
      </div>

      {loading ? (
        /* Skeleton */
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-line rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-slate-100 rounded w-24 mb-4" />
                <div className="h-7 bg-slate-100 rounded w-32 mb-1" />
                <div className="h-3 bg-slate-100 rounded w-20" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-line rounded-xl h-64 animate-pulse" />
            <div className="bg-white border border-line rounded-xl h-64 animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white border border-line rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium text-muted">{c.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.color} flex items-center justify-center shrink-0`}>
                    <c.icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-ink tracking-tight truncate">{c.value}</div>
                <div className="text-xs text-muted mt-1">{c.sub}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Produk terlaris */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white border border-line rounded-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-line flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-ink">Produk Terlaris</h2>
              </div>

              {terlaris.length === 0 ? (
                <div className="py-12 text-center">
                  <Trophy className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-muted">Belum ada data penjualan.</p>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {terlaris.map((p, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ backgroundColor: i === 0 ? '#234C6A' : i === 1 ? '#64748b' : '#94a3b8' }}
                          >
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium text-ink truncate">{p.nama}</span>
                        </div>
                        <span className="text-xs text-muted shrink-0 ml-2">
                          {p.total_terjual} terjual
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(p.total_terjual / maxTerlaris) * 100}%` }}
                          transition={{ duration: 0.6, delay: i * 0.06 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: i === 0 ? '#234C6A' : '#94a3b8' }}
                        />
                      </div>
                      <div className="text-xs text-muted mt-1">{rupiah(p.total_omzet)}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Daftar transaksi */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-line rounded-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-muted" />
                  <h2 className="text-sm font-semibold text-ink">Daftar Transaksi</h2>
                </div>
                <span className="text-xs text-muted">
                  {laporan?.transaksi.length ?? 0} transaksi
                </span>
              </div>

              {!laporan || laporan.transaksi.length === 0 ? (
                <div className="py-12 text-center">
                  <Receipt className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-muted">Tidak ada transaksi di periode ini.</p>
                </div>
              ) : (
                <div className="divide-y divide-line max-h-[50vh] overflow-y-auto">
                  {laporan.transaksi.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.04 }}
                      className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: '#234C6A' }}
                        >
                          {t.kasir?.name?.charAt(0) ?? 'K'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-ink">{t.invoice_no}</div>
                          <div className="text-xs text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t.kasir?.name} · {tanggal(t.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-ink shrink-0 ml-2">
                        {rupiah(t.total)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}