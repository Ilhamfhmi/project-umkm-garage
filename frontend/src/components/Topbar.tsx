import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../store/auth';

interface Props {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: Props) {
  const user = useAuth((s) => s.user);

  return (
    <header className="h-14 bg-white border-b border-line flex items-center justify-between px-4 sm:px-6 shrink-0">
      {/* Kiri */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg
            text-muted hover:bg-slate-100 hover:text-ink transition"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="hidden sm:block text-sm font-medium text-muted">
          Selamat datang, <span className="text-ink font-semibold">{user?.name ?? 'Admin'}</span>
        </div>
      </div>

      {/* Kanan */}
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg
          text-muted hover:bg-slate-100 hover:text-ink transition relative">
          <Bell className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2.5 pl-2 border-l border-line ml-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: '#234C6A' }}
          >
            {user?.name?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-ink leading-tight">{user?.name ?? 'Admin'}</div>
            <div className="text-[10px] text-muted capitalize">{user?.role ?? 'user'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}