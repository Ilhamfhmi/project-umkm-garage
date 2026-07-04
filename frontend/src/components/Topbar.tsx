import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../store/auth';

interface Props {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: Props) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  return (
    <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 sm:px-6 shrink-0">
      {/* Hamburger — cuma muncul di bawah lg */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* spacer biar user info tetap di kanan di desktop */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-right leading-tight">
          <div className="text-sm font-medium text-zinc-100">{user?.name}</div>
          <div className="text-[11px] text-zinc-500 capitalize">{user?.role}</div>
        </div>
        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-amber-400 shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <button
          onClick={logout}
          title="Logout"
          className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}