import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, ShoppingBag, Package, AlertTriangle,
  ArrowUp, ArrowDown, Clock, Users, DollarSign,
  Calendar, ChevronDown, RefreshCw, Zap, BarChart3,
  PieChart, Target, TrendingDown
} from 'lucide-react';
import { getDashboard } from '../api/report';
import { rupiah, tanggal } from '../lib/format';
import type { DashboardData, Transaksi } from '../types';

// Mini Chart Component (Simple SVG Sparkline)
function Sparkline({ data, color = '#f59e0b', height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (!data.length) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,100 ${points} 100,100`}
        fill={`url(#gradient-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Circular Progress Component
function CircularProgress({ value, max = 100, size = 60, strokeWidth = 4, color = '#f59e0b' }: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

// Skeleton Loading
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-zinc-800/50 rounded-lg ${className}`} />
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const result = await getDashboard();
      setData(result);
    } catch {
      setError('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Mock data untuk sparkline (nanti diganti dengan real data dari API)
  const mockSparklineData = useMemo(() => {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * 100));
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-32 h-8" />
              <Skeleton className="w-20 h-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-red-400 font-medium mb-2">{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
        >
          Coba Lagi
        </motion.button>
      </motion.div>
    );
  }

  // Calculate growth metrics (mock - adjust with real data)
  const omzetGrowth = 12.5; // percentage
  const transactionGrowth = 8.3;
  const averageTransaction = data.penjualan_hari_ini.jumlah_transaksi > 0
    ? data.penjualan_hari_ini.total_omzet / data.penjualan_hari_ini.jumlah_transaksi
    : 0;

  const cards = [
    {
      label: 'Omzet Hari Ini',
      value: rupiah(data.penjualan_hari_ini.total_omzet),
      sub: `${data.penjualan_hari_ini.jumlah_transaksi} transaksi`,
      icon: DollarSign,
      color: 'from-emerald-500/20 to-emerald-500/5',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      growth: omzetGrowth,
      sparklineData: mockSparklineData,
      sparklineColor: '#10b981',
      detail: `Rata-rata: ${rupiah(averageTransaction)}/transaksi`,
    },
    {
      label: 'Omzet Bulan Ini',
      value: rupiah(data.penjualan_bulan_ini.total_omzet),
      sub: `${data.penjualan_bulan_ini.jumlah_transaksi} transaksi`,
      icon: TrendingUp,
      color: 'from-blue-500/20 to-blue-500/5',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      growth: transactionGrowth,
      sparklineData: mockSparklineData.reverse(),
      sparklineColor: '#3b82f6',
      detail: `${data.penjualan_bulan_ini.jumlah_transaksi} transaksi bulan ini`,
    },
    {
      label: 'Total Produk',
      value: String(data.total_produk),
      sub: 'produk aktif',
      icon: Package,
      color: 'from-purple-500/20 to-purple-500/5',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      growth: null,
      sparklineData: null,
      sparklineColor: '#8b5cf6',
      detail: 'Manajemen inventori',
    },
    {
      label: 'Stok Menipis',
      value: String(data.stok_menipis.length),
      sub: 'perlu restok',
      icon: AlertTriangle,
      color: data.stok_menipis.length > 5 ? 'from-red-500/20 to-red-500/5' : 'from-orange-500/20 to-orange-500/5',
      iconBg: data.stok_menipis.length > 5 ? 'bg-red-500/10' : 'bg-orange-500/10',
      iconColor: data.stok_menipis.length > 5 ? 'text-red-400' : 'text-orange-400',
      growth: null,
      sparklineData: null,
      sparklineColor: '#ef4444',
      detail: data.stok_menipis.length > 0 
        ? `${data.stok_menipis.length} produk di bawah minimum`
        : 'Semua stok aman',
    },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-transparent to-amber-900/5 pointer-events-none" />

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center border border-amber-500/20"
          >
            <BarChart3 className="w-6 h-6 text-amber-400" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-sm text-zinc-400 mt-0.5 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Update terakhir: {tanggal(new Date().toISOString())}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 rounded-xl p-1">
            {[
              { key: 'today', label: 'Hari Ini' },
              { key: 'week', label: 'Minggu Ini' },
              { key: 'month', label: 'Bulan Ini' },
            ].map((period) => (
              <motion.button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as typeof selectedPeriod)}
                whileTap={{ scale: 0.95 }}
                className={`relative px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                  selectedPeriod === period.key
                    ? 'text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {selectedPeriod === period.key && (
                  <motion.div
                    layoutId="periodBg"
                    className="absolute inset-0 bg-amber-500 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{period.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, rotate: 180 }}
            onClick={fetchData}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`relative group bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 rounded-xl p-5 
              hover:border-zinc-700/80 transition-all duration-300 overflow-hidden
              hover:shadow-xl hover:shadow-${card.iconColor.split('-')[1]}-500/5`}
          >
            {/* Gradient Background on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-400 font-medium">{card.label}</span>
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}
                >
                  <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                </motion.div>
              </div>

              {/* Value with Growth Indicator */}
              <div className="mb-2">
                <div className="flex items-baseline gap-2">
                  <motion.span
                    key={card.value}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-xl font-bold text-zinc-100 truncate"
                  >
                    {card.value}
                  </motion.span>
                  {card.growth !== null && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className={`flex items-center gap-0.5 text-xs font-semibold ${
                        card.growth >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {card.growth >= 0 ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )}
                      <span>{Math.abs(card.growth)}%</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Sub Info */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">{card.sub}</span>
                {card.sparklineData && (
                  <div className="w-16 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Sparkline data={card.sparklineData} color={card.sparklineColor} height={24} />
                  </div>
                )}
              </div>

              {/* Additional Detail */}
              <div className="mt-2 pt-2 border-t border-zinc-800/50">
                <span className="text-[10px] text-zinc-600">{card.detail}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions - Takes 2 columns */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 rounded-xl overflow-hidden"
        >
          <div className="p-5 border-b border-zinc-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Transaksi Terbaru</h2>
                  <p className="text-xs text-zinc-500">Aktivitas transaksi terkini</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
              >
                Lihat Semua
                <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
              </motion.button>
            </div>
          </div>

          <div className="p-4">
            {data.transaksi_terbaru.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-400 font-medium">Belum ada transaksi</p>
                <p className="text-xs text-zinc-600 mt-1">Transaksi akan muncul di sini</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {data.transaksi_terbaru.map((t, index) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className="group flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center group-hover:border-zinc-600/50 transition-colors">
                        <ShoppingBag className="w-4 h-4 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                      </div>
                      <div>
                        <div className="text-sm font-medium group-hover:text-amber-300 transition-colors">
                          {t.invoice_no}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {t.kasir?.name || 'Unknown'}
                          </div>
                          <span>·</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {tanggal(t.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-400">
                        {rupiah(t.total)}
                      </div>
                      <div className="text-[10px] text-zinc-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Klik untuk detail
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Stock Alerts - Takes 1 column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 rounded-xl overflow-hidden"
        >
          <div className="p-5 border-b border-zinc-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Stok Menipis</h2>
                <p className="text-xs text-zinc-500">
                  {data.stok_menipis.length} produk perlu perhatian
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            {data.stok_menipis.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4"
                >
                  <Zap className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <p className="text-sm text-zinc-400 font-medium">Semua stok aman!</p>
                <p className="text-xs text-zinc-600 mt-1">Tidak ada produk yang perlu direstock</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {data.stok_menipis.map((p, index) => {
                  const stockPercentage = (p.stok / p.stok_minimum) * 100;
                  const isCritical = p.stok <= p.stok_minimum / 2;
                  
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30 hover:border-zinc-600/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.nama}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Min. stok: {p.stok_minimum}
                          </p>
                        </div>
                        <CircularProgress
                          value={p.stok}
                          max={p.stok_minimum * 2}
                          size={48}
                          strokeWidth={3}
                          color={isCritical ? '#ef4444' : '#f59e0b'}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <motion.span
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className={`text-xs font-bold ${
                            isCritical ? 'text-red-400' : 'text-orange-400'
                          }`}
                        >
                          Sisa {p.stok}
                        </motion.span>
                        <span className="text-[10px] text-zinc-600">
                          {isCritical ? '⚠️ Segera restock' : '⚡ Perlu perhatian'}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(stockPercentage, 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            isCritical ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-orange-500 to-amber-400'
                          }`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Additional Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {/* Average Transaction */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 rounded-xl p-4 group hover:border-zinc-700/80 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Rata-rata Transaksi</p>
              <p className="text-lg font-bold text-zinc-100">{rupiah(averageTransaction)}</p>
            </div>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              transition={{ duration: 1, delay: 0.8 }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
            />
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 rounded-xl p-4 group hover:border-zinc-700/80 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <PieChart className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Total Produk</p>
              <p className="text-lg font-bold text-zinc-100">{data.total_produk} Produk</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                transition={{ duration: 1, delay: 0.9 }}
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
              />
            </div>
            <span className="text-[10px] text-zinc-600">Aktif</span>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 rounded-xl p-4 group hover:border-zinc-700/80 transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">Performa</p>
              <p className="text-lg font-bold text-emerald-400">Baik</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 + i * 0.1 }}
                className={`flex-1 h-1.5 rounded-full ${
                  i < 4 ? 'bg-emerald-500' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}