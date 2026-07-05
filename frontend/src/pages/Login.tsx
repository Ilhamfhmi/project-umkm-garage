import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../store/auth';
import { toast } from '../store/toast';

export default function Login() {
  const navigate = useNavigate();
  const loginFn = useAuth((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await loginFn(email, password);
      toast.success('Berhasil masuk', 'Selamat datang kembali!');
      navigate('/');
    } catch (err: any) {
      toast.error(
        'Gagal masuk',
        err.response?.data?.message ?? 'Periksa kembali email & password Anda.'
      );
    } finally {
      setLoading(false);
    }
  }

  const features = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Transaksi cepat & akurat',
      sub: 'Proses dalam hitungan detik',
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      title: 'Analitik real-time',
      sub: 'Keputusan berbasis data',
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      title: 'Manajemen stok otomatis',
      sub: 'Stok selalu terpantau akurat',
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Manajemen tim & role',
      sub: 'Kolaborasi yang efisien',
    },
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 lg:p-12">
      <div className="w-full max-w-6xl flex gap-10 items-stretch">

        {/* ── Kiri: Form ── */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col justify-center px-4 sm:px-8 py-12"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#234C6A' }}
            >
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-ink tracking-tight text-sm">Chevy Motor</div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Sistem Kasir</div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-ink tracking-tight">Selamat Datang</h2>
            <p className="text-sm text-muted mt-1.5">
              Akses akun dan kelola bengkel Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#234C6A] transition" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                  className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm text-ink
                    placeholder:text-slate-400 transition-all
                    focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#234C6A] transition" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-11 py-3 text-sm text-ink
                    placeholder:text-slate-400 transition-all
                    focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#234C6A] transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center text-white font-semibold
                rounded-lg py-3 text-sm transition-all mt-2
                disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#234C6A' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e435e')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#234C6A')}
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Masuk'}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-muted">
              Butuh akses? Hubungi administrator sistem Anda.
            </p>
          </div>
        </motion.div>

        {/* ── Kanan: Navy panel lebih lebar ── */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="hidden lg:flex w-[600px] shrink-0 rounded-2xl overflow-hidden flex-col justify-between p-12 text-white relative min-h-[620px]"
          style={{ backgroundColor: '#234C6A' }}
        >
          {/* Diagonal lines pattern */}
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id="diag"
                x="0" y="0"
                width="24" height="24"
                patternUnits="userSpaceOnUse"
              >
                <line x1="0" y1="24" x2="24" y2="0"
                  stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                <line x1="-6" y1="6" x2="6" y2="-6"
                  stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                <line x1="18" y1="30" x2="30" y2="18"
                  stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diag)" />
          </svg>

          {/* Gradient overlay atas & bawah */}
          <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-[#234C6A] to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#1a3a52] to-transparent" />

          {/* Konten */}
          <div className="relative z-10 flex flex-col justify-between h-full gap-8">

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm tracking-tight">Chevy Motor</div>
                <div className="text-[10px] text-white/50 uppercase tracking-widest">
                  Sistem Kasir Bengkel
                </div>
              </div>
            </motion.div>

            {/* Tengah */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex-1 flex flex-col justify-center gap-8"
            >
              {/* Headline */}
              <div>
                <div className="w-8 h-[3px] bg-white/40 mb-5" />
                <h1 className="text-[2rem] font-bold leading-[1.2] tracking-tight">
                  Sistem Manajemen<br />
                  <span className="text-white/75">Bengkel Modern</span>
                </h1>
                <p className="mt-3 text-sm text-white/55 leading-relaxed max-w-sm">
                  Platform terintegrasi untuk mengoptimalkan operasional bengkel
                  Anda dengan teknologi terkini.
                </p>
              </div>

              {/* Card putih 1 — fitur list */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-5"
              >
                <div className="space-y-4">
                  {features.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + i * 0.08 }}
                      className="flex items-center gap-3.5"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-white/80">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white leading-tight">{item.title}</div>
                        <div className="text-xs text-white/50 mt-0.5">{item.sub}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Card putih 2 — highlight */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 }}
                className="bg-white rounded-xl p-5 shadow-lg shadow-black/10"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#234C6A' }}
                  >
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-snug" style={{ color: '#234C6A' }}>
                      Kelola Bengkel Lebih Mudah & Efisien
                    </h3>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                      Dirancang khusus untuk bengkel UMKM cepat, akurat,
                      dan mudah digunakan siapa saja.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-[11px] text-white/30"
            >
              © 2026 Bengkel Chevy Motor. All rights reserved.
            </motion.p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}