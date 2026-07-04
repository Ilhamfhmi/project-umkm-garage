import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Package, Tags,
  Users, Boxes, FileBarChart, Wrench, X, RotateCcw,
  ChevronLeft, ChevronRight, Settings, LogOut,
  HelpCircle, ChevronDown, User,
} from 'lucide-react';
import { useAuth } from '../store/auth';
import { canAccess } from '../lib/permissions';

const menu = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, description: 'Ringkasan bisnis' },
  { to: '/kasir', label: 'Kasir', icon: ShoppingCart, description: 'Transaksi penjualan' },
  { to: '/retur', label: 'Retur', icon: RotateCcw, description: 'Pengembalian barang' },
  { to: '/produk', label: 'Produk', icon: Package, description: 'Manajemen produk' },
  { to: '/kategori', label: 'Kategori', icon: Tags, description: 'Kategori produk' },
  { to: '/stok', label: 'Stok', icon: Boxes, description: 'Monitor stok' },
  { to: '/pelanggan', label: 'Pelanggan', icon: Users, description: 'Data pelanggan' },
  { to: '/laporan', label: 'Laporan', icon: FileBarChart, description: 'Analisis & laporan' },
];

function NavItems({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed: boolean }) {
  const role = useAuth((s) => s.user?.role);
  const visibleMenu = menu.filter((m) => canAccess(m.to, role));

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {!collapsed && (
        <span className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Menu Utama
        </span>
      )}

      <div className="mt-2 space-y-1">
        {visibleMenu.map(({ to, label, icon: Icon, end, description }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200
              ${isActive
                ? 'bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-500/5'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}
              ${collapsed ? 'justify-center px-2' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <div
                  className={`relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                    ${isActive
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-transparent text-zinc-500 group-hover:bg-zinc-700/50 group-hover:text-zinc-300'}`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium truncate block ${isActive ? 'text-amber-400' : 'text-zinc-300'}`}>
                      {label}
                    </span>
                    {description && (
                      <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{description}</p>
                    )}
                  </div>
                )}

                {/* Tooltip saat collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-zinc-800 border border-zinc-700
                    rounded-lg text-xs text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100
                    pointer-events-none transition-opacity z-50 shadow-xl">
                    <div className="font-medium">{label}</div>
                    {description && <div className="text-zinc-500 text-[10px]">{description}</div>}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function Brand({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <div className={`h-16 flex items-center border-b border-zinc-800/50
      ${collapsed ? 'px-2 justify-center' : 'px-5 justify-between'}`}>
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600
            flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Wrench className="w-4 h-4 text-zinc-950" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-900" />
        </div>

        {!collapsed && (
          <div className="leading-tight overflow-hidden">
            <div className="text-sm font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              Chevy Motor
            </div>
            <div className="text-[10px] text-zinc-500 flex items-center gap-1">
              <span className="w-1 h-1 bg-emerald-500 rounded-full" />
              Sistem Kasir
            </div>
          </div>
        )}
      </div>

      {/* Toggle collapse (desktop only) */}
      <button
        onClick={onToggle}
        className="hidden lg:flex p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );
}

function UserProfile({ collapsed }: { collapsed: boolean }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  return (
    <div className={`border-t border-zinc-800/50 ${collapsed ? 'p-2' : 'p-3'}`}>
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className={`w-full flex items-center gap-2.5 rounded-lg transition-all
          ${collapsed ? 'justify-center p-2' : 'p-2 hover:bg-zinc-800/50'}`}
      >
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600
            flex items-center justify-center text-zinc-950 text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-900" />
        </div>

        {!collapsed && (
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-zinc-200 truncate">{user?.name || 'Admin'}</div>
            <div className="text-[10px] text-zinc-500 truncate capitalize">{user?.role || 'user'}</div>
          </div>
        )}

        {!collapsed && (
          <motion.div animate={{ rotate: showUserMenu ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-3 h-3 text-zinc-600" />
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {showUserMenu && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-2 space-y-1"
          >
            {[
              { icon: User, label: 'Profil Saya' },
              { icon: Settings, label: 'Pengaturan' },
              { icon: HelpCircle, label: 'Bantuan' },
            ].map((item, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400
                  hover:text-zinc-200 hover:bg-zinc-800/50 transition-all"
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}

            <div className="my-1 border-t border-zinc-800/50" />

            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400
                hover:text-red-300 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setCollapsed((prev: boolean) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      {/* Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden lg:flex flex-col bg-zinc-900/95 border-r border-zinc-800/50 relative overflow-hidden shrink-0"
      >
        <Brand collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <NavItems collapsed={collapsed} />
        <UserProfile collapsed={collapsed} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 left-0 h-full w-72 bg-zinc-900/95 backdrop-blur-xl border-r
                border-zinc-800/50 z-50 flex flex-col lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800/50 pr-3">
                <Brand collapsed={false} onToggle={() => {}} />
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <NavItems onNavigate={onClose} collapsed={false} />
              <UserProfile collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}