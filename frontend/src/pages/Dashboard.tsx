import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle,
  ArrowUpRight, Clock,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { getDashboard, getLaporanPenjualan } from '../api/report';
import { rupiah, tanggal } from '../lib/format';
import type { DashboardData } from '../types';

/* Generate 30 hari terakhir buat label chart */
function getLast30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    });
  }
  return days;
}

/* Custom tooltip */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-line rounded-lg shadow-lg px-3 py-2.5 text-xs">
      <div className="text-muted mb-1">{label}</div>
      <div className="font-bold text-ink">{rupiah(payload[0]?.value ?? 0)}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [chartData, setChartData] = useState<{ label: string; omzet: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const days = getLast30Days();
        const from = days[0].date;
        const to = days[days.length - 1].date;

        const [dash, laporan] = await Promise.all([
          getDashboard(),
          getLaporanPenjualan(from, to),
        ]);

        setData(dash);

        // Map transaksi ke chart per hari
        const txByDate: Record<string, number> = {};
        laporan.transaksi.forEach((t: any) => {
          const d = t.created_at?.slice(0, 10);
          if (d) txByDate[d] = (txByDate[d] ?? 0) + parseFloat(t.total ?? 0);
        });

        setChartData(
          days.map((d) => ({
            label: d.label,
            omzet: txByDate[d.date] ?? 0,
          }))
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = data
    ? [
        {
          label: 'Omzet Hari Ini',
          value: rupiah(data.penjualan_hari_ini.total_omzet),
          sub: `${data.penjualan_hari_ini.jumlah_transaksi} transaksi`,
          icon: TrendingUp,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
        },
        {
          label: 'Omzet Bulan Ini',
          value: rupiah(data.penjualan_bulan_ini.total_omzet),
          sub: `${data.penjualan_bulan_ini.jumlah_transaksi} transaksi`,
          icon: ArrowUpRight,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
        },
        {
          label: 'Total Produk',
          value: String(data.total_produk),
          sub: 'Produk aktif',
          icon: Package,
          color: 'text-violet-600',
          bg: 'bg-violet-50',
        },
        {
          label: 'Stok Menipis',
          value: String(data.stok_menipis.length),
          sub: 'Perlu restock',
          icon: AlertTriangle,
          color: data.stok_menipis.length > 0 ? 'text-amber-600' : 'text-slate-400',
          bg: data.stok_menipis.length > 0 ? 'bg-amber-50' : 'bg-slate-50',
        },
      ]
    : [];

  /* Total & transaksi bulan ini buat summary chart */
  const totalOmzetBulan = data?.penjualan_bulan_ini.total_omzet ?? 0;
  const totalTrxBulan   = data?.penjualan_bulan_ini.jumlah_transaksi ?? 0;
  const totalOmzetHari  = data?.penjualan_hari_ini.total_omzet ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-muted mt-0.5">Ringkasan operasional bengkel hari ini.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-line rounded-xl p-5 animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-24 mb-4" />
              <div className="h-7 bg-slate-100 rounded w-32 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white border border-line rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-medium text-muted">{s.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-ink tracking-tight">{s.value}</div>
                <div className="text-xs text-muted mt-1">{s.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Chart penjualan */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white border border-line rounded-xl overflow-hidden"
          >
            {/* Header chart */}
            <div className="px-6 pt-5 pb-4 border-b border-line flex items-start justify-between">
              <div>
                <p className="text-xs text-muted font-medium">Performa Penjualan</p>
                <h2 className="text-base font-bold text-ink mt-0.5">
                  Omzet <span style={{ color: '#234C6A' }}>30 Hari Terakhir</span>
                </h2>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-[2px] rounded-full inline-block" style={{ backgroundColor: '#234C6A' }} />
                <span className="text-xs text-muted">Omzet harian</span>
              </div>
            </div>

            {/* Area chart */}
            <div className="px-2 pt-4 pb-2">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="navyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#234C6A" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#234C6A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v)}
                    width={44}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#234C6A', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="omzet"
                    stroke="#234C6A"
                    strokeWidth={2}
                    fill="url(#navyGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#234C6A', stroke: 'white', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Summary stats di bawah chart — seperti referensi */}
            <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
              {[
                { label: 'Omzet Hari Ini', value: rupiah(totalOmzetHari) },
                { label: 'Omzet Bulan Ini', value: rupiah(totalOmzetBulan) },
                { label: 'Jumlah Transaksi', value: `${totalTrxBulan} transaksi` },
              ].map((s) => (
                <div key={s.label} className="px-5 py-4">
                  <div className="text-xs text-muted mb-1">{s.label}</div>
                  <div className="text-lg font-bold text-ink tracking-tight">{s.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Transaksi terbaru */}
            <div className="lg:col-span-2 bg-white border border-line rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-muted" />
                  <h2 className="text-sm font-semibold text-ink">Transaksi Terbaru</h2>
                </div>
                <span className="text-xs text-muted">5 terakhir</span>
              </div>
              {!data?.transaksi_terbaru?.length ? (
                <div className="px-5 py-10 text-center text-sm text-muted">
                  Belum ada transaksi.
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {data.transaksi_terbaru.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: '#234C6A' }}
                        >
                          {t.kasir?.name?.charAt(0) ?? 'K'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-ink">{t.invoice_no}</div>
                          <div className="text-xs text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {tanggal(t.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-ink">{rupiah(t.total)}</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Stok menipis */}
            <div className="bg-white border border-line rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-line flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-ink">Stok Menipis</h2>
              </div>
              {!data?.stok_menipis?.length ? (
                <div className="px-5 py-10 text-center">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Package className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-sm text-muted">Semua stok aman.</p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {data.stok_menipis.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{p.nama}</div>
                        <div className="text-xs text-muted">Min: {p.stok_minimum}</div>
                      </div>
                      <span className="ml-2 shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700">
                        {p.stok} sisa
                      </span>
                    </motion.div>
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