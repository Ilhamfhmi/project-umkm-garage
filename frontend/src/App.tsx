import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './store/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kasir from './pages/Kasir';
import Retur from './pages/Retur';
import Produk from './pages/Produk';
import Kategori from './pages/Kategori';
import Stok from './pages/Stok';
import Pelanggan from './pages/Pelanggan';
import Laporan from './pages/Laporan';
import Toaster from './components/ui/Toaster';
import ConfirmDialog from './components/ui/ConfirmDialog'
import RoleRoute from './components/RoleRoute';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const loadUser = useAuth((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <BrowserRouter>
      <Toaster />
      <ConfirmDialog />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/kasir"
            element={<RoleRoute path="/kasir"><Kasir /></RoleRoute>}
          />
          <Route
            path="/retur"
            element={<RoleRoute path="/retur"><Retur /></RoleRoute>}
          />
          <Route path="/produk" element={<Produk />} />
          <Route
            path="/kategori"
            element={<RoleRoute path="/kategori"><Kategori /></RoleRoute>}
          />
          <Route path="/stok" element={<Stok />} />
          <Route path="/pelanggan" element={<Pelanggan />} />
          <Route
            path="/laporan"
            element={<RoleRoute path="/laporan"><Laporan /></RoleRoute>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}