import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { canAccess } from '../lib/permissions';

export default function RoleRoute({ path, children }: { path: string; children: React.ReactNode }) {
  const role = useAuth((s) => s.user?.role);
  const loading = useAuth((s) => s.loading);

  if (loading) return null; // tunggu user termuat

  if (!canAccess(path, role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}