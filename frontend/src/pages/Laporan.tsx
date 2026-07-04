import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Receipt, Percent, Trophy, Calendar,
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

  const cards = laporan
    ? [
        {
          label: 'Total Omzet',
          value: rupiah(laporan.ringkasan.total_omzet),
          icon: TrendingUp,
        },
        {
          label: 'Jumlah Transaksi',
          value: String(laporan.ringkasan.jumlah_transaksi),
          icon: Receipt,
        },
        {
          label: 'Total Diskon',
          value: rupiah(laporan.ringkasan.total_diskon),
          icon: Percent,
        },
      ]
    : [];

  const maxTerlaris = terlaris.length > 0 ? terlaris[0].total_terjual : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Laporan</h1>
        <p className="text-sm text-zinc-500">Analisis penjualan per periode</p>
      </div>

      {/* Filter periode */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-zinc-400 mb-1">Dari Tanggal</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-zinc-400 mb-1">Sampai Tanggal</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
        <button
          onClick={load}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg px-6 py-2 text-sm transition"
        >
          Tampilkan
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Memuat...</p>
      ) : (
        <>
          {/* Kartu ringkasan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cards.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-500">{c.label}</span>
                  <c.icon className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-lg font-bold truncate">{c.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Produk terlaris */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold">Produk Terlaris</h2>
              </div>
              {terlaris.length === 0 ? (
                <p className="text-sm text-zinc-500">Belum ada data.</p>
              ) : (
                <div className="space-y-3">
                  {terlaris.map((p, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="truncate">{i + 1}. {p.nama}</span>
                        <span className="text-zinc-400 shrink-0 ml-2">
                          {p.total_terjual} terjual
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(p.total_terjual / maxTerlaris) * 100}%` }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                          className="h-full bg-amber-500 rounded-full"
                        />
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {rupiah(p.total_omzet)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daftar transaksi */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold mb-3">Daftar Transaksi</h2>
              {!laporan || laporan.transaksi.length === 0 ? (
                <p className="text-sm text-zinc-500">Tidak ada transaksi di periode ini.</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {laporan.transaksi.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{t.invoice_no}</div>
                        <div className="text-xs text-zinc-500">
                          {t.kasir?.name} · {tanggal(t.created_at)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-amber-400 shrink-0 ml-2">
                        {rupiah(t.total)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}