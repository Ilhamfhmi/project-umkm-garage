import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Package, Tags,
  Users, Boxes, FileBarChart, Wrench, X,
  ChevronLeft, ChevronRight, LogOut, RotateCcw,
  ChevronDown, Settings, HelpCircle, User,
} from 'lucide-react';
import { useAuth } from '../store/auth';
import { canAccess } from '../lib/permissions';

const menu = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, description: 'Ringkasan bisnis' },
  { to: '/kasir', label: 'Kasir', icon: ShoppingCart, description: 'Transaksi penjualan' },
  { to: '/retur', label: 'Retur', icon: RotateCcw, description: 'Pengembalian barang' },
  { to: '/produk', label: 'Produk', icon: Package, description: 'Manajemen produk' },
  { to: '/kategori', label: 'Merek', icon: Tags, description: 'Kelola merek produk' },
  { to: '/stok', label: 'Stok', icon: Boxes, description: 'Monitor stok' },
  { to: '/pelanggan', label: 'Pelanggan', icon: Users, description: 'Data pelanggan' },
  { to: '/laporan', label: 'Laporan', icon: FileBarChart, description: 'Analisis & laporan' },
];

function NavItems({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed: boolean }) {
  const role = useAuth((s) => s.user?.role);
  const visibleMenu = menu.filter((m) => canAccess(m.to, role));

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto">
      {!collapsed && (
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Menu Utama
        </p>
      )}
      <div className="space-y-0.5">
        {visibleMenu.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg transition-all duration-150
              ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
              ${isActive
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:bg-white/8 hover:text-white/90'}`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}

                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${isActive ? 'bg-white/15' : 'group-hover:bg-white/10'}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {!collapsed && (
                  <span className="text-sm font-medium">{label}</span>
                )}

                {/* Tooltip saat collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1a3a52] border border-white/10
                    rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100
                    pointer-events-none transition-opacity z-50 shadow-xl">
                    {label}
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
    <div className={`h-16 flex items-center border-b border-white/10 shrink-0
      ${collapsed ? 'px-3 justify-center' : 'px-5 justify-between'}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold text-white tracking-tight truncate">Chevy Motor</div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">Sistem Kasir</div>
          </div>
        )}
      </div>
      <button
        onClick={onToggle}
        className="hidden lg:flex w-6 h-6 items-center justify-center rounded text-white/40
          hover:text-white hover:bg-white/10 transition shrink-0"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function UserProfile({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className={`border-t border-white/10 shrink-0 ${collapsed ? 'p-2' : 'p-3'}`}>
      <button
        onClick={() => !collapsed && setOpen(!open)}
        className={`w-full flex items-center gap-2.5 rounded-lg transition-all
          ${collapsed ? 'justify-center p-1.5' : 'p-2 hover:bg-white/8'}`}
      >
        <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center
          justify-center text-white text-xs font-bold shrink-0">
          {user?.name?.charAt(0).toUpperCase() ?? 'A'}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name ?? 'Admin'}</div>
              <div className="text-[10px] text-white/40 capitalize">{user?.role ?? 'user'}</div>
            </div>
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3.5 h-3.5 text-white/40" />
            </motion.div>
          </>
        )}
      </button>

      <AnimatePresence>
        {open && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-1 space-y-0.5"
          >
            {[
              { icon: User, label: 'Profil Saya' },
              { icon: Settings, label: 'Pengaturan' },
              { icon: HelpCircle, label: 'Bantuan' },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                  text-xs text-white/50 hover:text-white hover:bg-white/8 transition"
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
            <div className="my-1 border-t border-white/10" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg
                text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout langsung saat collapsed */}
      {collapsed && (
        <button
          onClick={handleLogout}
          className="w-full mt-1 flex items-center justify-center p-1.5 rounded-lg
            text-red-300 hover:bg-red-500/10 transition"
          title="Keluar"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: Props) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sidebar_collapsed') ?? 'false'); }
    catch { return false; }
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setCollapsed((p: boolean) => !p);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const sidebarContent = (isMobile = false) => (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: '#234C6A' }}
    >
      <div className="relative z-10 flex flex-col h-full">
        <Brand collapsed={isMobile ? false : collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <NavItems collapsed={isMobile ? false : collapsed} onNavigate={isMobile ? onClose : undefined} />
        <UserProfile collapsed={isMobile ? false : collapsed} />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 68 : 232 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="hidden lg:block relative shrink-0 overflow-hidden"
      >
        {sidebarContent()}
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
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 left-0 h-full w-64 z-50 lg:hidden relative overflow-hidden"
            >
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-lg
                    text-white/50 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}