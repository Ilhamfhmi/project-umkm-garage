import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, X, Plus, Minus,
  ChevronRight, CheckCircle2, Printer,
} from 'lucide-react';
import { getCategories } from '../api/category';
import { getBrands, type Brand } from '../api/brand';
import { searchProducts } from '../api/product';
import { useCart } from '../store/cart';
import { rupiah } from '../lib/format';
import { toast } from '../store/toast';
import type { Category, Product } from '../types';

// ── Checkout modal ──────────────────────────────────────────
import { checkout } from '../api/sale';
import { useAuth } from '../store/auth';

interface SuccessData {
  invoice_no: string;
  created_at: string;
  kasir?: string;
  tipe_harga: 'umum' | 'mitra';
  items: { nama: string; qty: number; harga: number; subtotal: number }[];
  subtotal: number;
  diskon: number;
  total: number;
  bayar: number;
  kembalian: number;
}

export default function Kasir() {
  const user = useAuth((s) => s.user);
  const cart = useCart();

  // ── Navigasi hierarki ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [activeCat, setActiveCat] = useState<Category | null>(null);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);

  // ── Search ──
  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Loading ──
  const [loadingCat, setLoadingCat] = useState(true);
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  // ── Checkout ──
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [diskon, setDiskon] = useState(0);
  const [bayar, setBayar] = useState(0);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  // Load kategori
  useEffect(() => {
    getCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setActiveCat(cats[0]);
      })
      .finally(() => setLoadingCat(false));
  }, []);

  // Load brand saat kategori berubah
  useEffect(() => {
    if (!activeCat) return;
    setActiveBrand(null);
    setProducts([]);
    setLoadingBrand(true);
    getBrands(activeCat.id)
      .then(setBrands)
      .finally(() => setLoadingBrand(false));
  }, [activeCat]);

  // Load produk saat brand berubah
  useEffect(() => {
    if (!activeBrand) return;
    setLoadingProduct(true);
    searchProducts('', activeCat?.id, activeBrand.id)
      .then(setProducts)
      .finally(() => setLoadingProduct(false));
  }, [activeBrand]);

  // Search mode — cari langsung tanpa filter hierarki
  useEffect(() => {
    if (!searchMode) return;
    if (!search.trim()) { setProducts([]); return; }
    setLoadingProduct(true);
    const timer = setTimeout(() => {
      searchProducts(search)
        .then(setProducts)
        .finally(() => setLoadingProduct(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchMode]);

  function enterSearch() {
    setSearchMode(true);
    setSearch('');
    setProducts([]);
    setTimeout(() => searchRef.current?.focus(), 100);
  }

  function exitSearch() {
    setSearchMode(false);
    setSearch('');
    setProducts([]);
    // Reload produk brand aktif
    if (activeBrand) {
      setLoadingProduct(true);
      searchProducts('', activeCat?.id, activeBrand.id)
        .then(setProducts)
        .finally(() => setLoadingProduct(false));
    }
  }

  function addToCart(p: Product) {
    if (p.stok <= 0) {
      toast.error('Stok habis', `${p.nama} tidak tersedia.`);
      return;
    }
    const harga = cart.tipeHarga === 'mitra'
      ? parseFloat(p.harga_mitra)
      : parseFloat(p.harga_umum);
    const existing = cart.items.find((i) => i.product.id === p.id);
    if (existing && existing.qty >= p.stok) {
      toast.error('Stok tidak cukup', `Maksimal ${p.stok} ${p.satuan}.`);
      return;
    }
    cart.addItem(p, harga);
    toast.success(`${p.nama} ditambahkan`, `ke keranjang`);
  }

  // Checkout
  const subtotal = cart.subtotal();
  const total = Math.max(0, subtotal - diskon);
  const kembalian = bayar - total;

  async function handleBayar() {
    if (bayar < total) {
      toast.error('Uang kurang', `Kurang ${rupiah(total - bayar)}`);
      return;
    }
    setPaying(true);
    try {
      const snapshot = cart.items.map((it) => ({
        nama: it.product.nama,
        qty: it.qty,
        harga: it.harga,
        subtotal: it.harga * it.qty,
      }));
      const res = await checkout({
        tipe_harga: cart.tipeHarga,
        bayar,
        diskon,
        items: cart.items.map((it) => ({
          product_id: it.product.id,
          qty: it.qty,
        })),
      });
      setSuccess({
        invoice_no: res.invoice_no,
        created_at: res.created_at ?? new Date().toISOString(),
        kasir: user?.name,
        tipe_harga: cart.tipeHarga,
        items: snapshot,
        subtotal,
        diskon,
        total,
        bayar,
        kembalian: parseFloat(res.kembalian),
      });
      cart.clear();
      toast.success('Transaksi berhasil', res.invoice_no);
    } catch (err: any) {
      toast.error('Transaksi gagal', err.response?.data?.message);
    } finally {
      setPaying(false);
    }
  }

  function resetCheckout() {
    setSuccess(null);
    setCheckoutOpen(false);
    setCartOpen(false);
    setDiskon(0);
    setBayar(0);
  }

  const quickAmounts = [
    total,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
    Math.ceil(total / 50000) * 50000 + 50000,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total).slice(0, 4);

  return (
    <div className="flex flex-col h-full -m-6">

      {/* ── TOP BAR ── */}
      <div className="bg-white border-b border-line px-4 py-3 flex items-center gap-3 shrink-0">
        {/* Tipe harga toggle */}
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {(['umum', 'mitra'] as const).map((t) => (
            <button
              key={t}
              onClick={() => cart.setTipeHarga(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                cart.tipeHarga === t
                  ? 'bg-white text-[#234C6A] shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className={`flex-1 relative transition-all ${searchMode ? 'flex' : 'flex'}`}>
          {searchMode ? (
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari produk apa saja..."
                  className="w-full border border-[#234C6A] rounded-lg pl-10 pr-4 py-2 text-sm text-ink
                    focus:outline-none focus:ring-2 focus:ring-[#234C6A]/10"
                />
              </div>
              <button
                onClick={exitSearch}
                className="text-xs text-muted hover:text-red-500 transition px-2"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={enterSearch}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-sm text-muted hover:border-[#234C6A] hover:text-[#234C6A] transition w-full sm:w-64"
            >
              <Search className="w-4 h-4" />
              Cari produk cepat...
            </button>
          )}
        </div>

        {/* Keranjang */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition"
          style={{ backgroundColor: '#234C6A' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e435e')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#234C6A')}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">Keranjang</span>
          {cart.items.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {cart.items.length}
            </span>
          )}
        </button>
      </div>

      {/* ── NAVIGASI HIERARKI ── */}
      {!searchMode && (
        <div className="bg-white border-b border-line shrink-0">
          {/* Tab Kategori */}
          <div className="flex gap-1 px-4 pt-3 overflow-x-auto scrollbar-hide">
            {loadingCat ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-8 w-24 bg-slate-100 rounded-full animate-pulse shrink-0" />
              ))
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                    activeCat?.id === cat.id
                      ? 'text-white'
                      : 'bg-slate-100 text-muted hover:bg-slate-200 hover:text-ink'
                  }`}
                  style={activeCat?.id === cat.id ? { backgroundColor: '#234C6A' } : {}}
                >
                  {cat.nama}
                </button>
              ))
            )}
          </div>

          {/* Tab Merek */}
          <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-hide">
            {loadingBrand ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-7 w-20 bg-slate-100 rounded-full animate-pulse shrink-0" />
              ))
            ) : brands.length === 0 ? (
              <p className="text-xs text-muted py-1">Pilih kategori dulu.</p>
            ) : (
              brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBrand(b)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap border ${
                    activeBrand?.id === b.id
                      ? 'border-[#234C6A] text-[#234C6A] bg-[#234C6A]/5'
                      : 'border-line text-muted hover:border-slate-300 hover:text-ink'
                  }`}
                >
                  {b.nama}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── GRID PRODUK ── */}
      <div className="flex-1 overflow-y-auto p-4 bg-canvas">
        {/* Breadcrumb */}
        {!searchMode && activeCat && (
          <div className="flex items-center gap-1.5 text-xs text-muted mb-3">
            <span>{activeCat.nama}</span>
            {activeBrand && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#234C6A] font-medium">{activeBrand.nama}</span>
              </>
            )}
          </div>
        )}

        {loadingProduct ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white border border-line rounded-xl p-3 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-3" />
                <div className="h-6 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : !activeBrand && !searchMode ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-12 h-12 rounded-full bg-white border border-line flex items-center justify-center mx-auto mb-3 shadow-sm">
              <ShoppingCart className="w-5 h-5 text-muted" />
            </div>
            <p className="text-sm font-medium text-ink">Pilih merek produk</p>
            <p className="text-xs text-muted mt-1">Klik salah satu merek di atas untuk melihat produk.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-12 h-12 rounded-full bg-white border border-line flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Search className="w-5 h-5 text-muted" />
            </div>
            <p className="text-sm font-medium text-ink">
              {searchMode ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            </p>
            <p className="text-xs text-muted mt-1">
              {searchMode ? `Tidak ada hasil untuk "${search}"` : 'Produk belum tersedia untuk merek ini.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((p, i) => {
              const harga = cart.tipeHarga === 'mitra'
                ? parseFloat(p.harga_mitra)
                : parseFloat(p.harga_umum);
              const habis = p.stok <= 0;
              const inCart = cart.items.find((it) => it.product.id === p.id);

              return (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => !habis && addToCart(p)}
                  disabled={habis}
                  className={`relative bg-white border rounded-xl p-3 text-left transition-all
                    ${habis
                      ? 'opacity-50 cursor-not-allowed border-line'
                      : inCart
                        ? 'border-[#234C6A] shadow-sm ring-1 ring-[#234C6A]/20'
                        : 'border-line hover:border-[#234C6A]/50 hover:shadow-sm'}`}
                >
                  {/* Badge qty di keranjang */}
                  {inCart && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: '#234C6A' }}>
                      {inCart.qty}
                    </span>
                  )}

                  {/* Nama produk */}
                  <div className="text-xs font-semibold text-ink leading-tight line-clamp-2 mb-1.5 min-h-[2.5rem]">
                    {p.nama}
                  </div>

                  {/* Stok */}
                  <div className={`text-[10px] mb-2 ${
                    habis ? 'text-red-500' :
                    p.stok <= p.stok_minimum && p.stok_minimum > 0 ? 'text-amber-500' :
                    'text-muted'
                  }`}>
                    {habis ? 'Stok habis' : `Stok: ${p.stok} ${p.satuan}`}
                  </div>

                  {/* Harga */}
                  <div className="text-sm font-bold" style={{ color: '#234C6A' }}>
                    {rupiah(harga)}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PANEL KERANJANG ── */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-muted" />
                  <h2 className="text-base font-semibold text-ink">Keranjang</h2>
                  <span className="text-xs text-muted">({cart.items.length} item)</span>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Item list */}
              <div className="flex-1 overflow-y-auto divide-y divide-line">
                {cart.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                    <ShoppingCart className="w-10 h-10 text-slate-200 mb-3" />
                    <p className="text-sm text-muted">Keranjang masih kosong.</p>
                  </div>
                ) : (
                  cart.items.map((it) => (
                    <div key={it.product.id} className="px-5 py-3.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{it.product.nama}</div>
                        <div className="text-xs text-muted">{rupiah(it.harga)} / {it.product.satuan}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => cart.updateQty(it.product.id, it.qty - 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
                        >
                          <Minus className="w-3 h-3 text-ink" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-ink">{it.qty}</span>
                        <button
                          onClick={() => cart.updateQty(it.product.id, it.qty + 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
                        >
                          <Plus className="w-3 h-3 text-ink" />
                        </button>
                      </div>
                      <div className="text-sm font-bold text-ink w-20 text-right shrink-0">
                        {rupiah(it.harga * it.qty)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {cart.items.length > 0 && (
                <div className="border-t border-line p-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-bold text-ink text-base">{rupiah(subtotal)}</span>
                  </div>
                  <button
                    onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                    className="w-full py-3 rounded-lg text-white font-semibold text-sm transition"
                    style={{ backgroundColor: '#234C6A' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e435e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#234C6A')}
                  >
                    Lanjut Bayar
                  </button>
                  <button
                    onClick={() => cart.clear()}
                    className="w-full py-2 rounded-lg text-xs text-muted hover:text-red-500 hover:bg-red-50 transition"
                  >
                    Kosongkan keranjang
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MODAL CHECKOUT ── */}
      <AnimatePresence>
        {checkoutOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !success && setCheckoutOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md
                bg-white rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              {success ? (
                /* ── Layar sukses ── */
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-lg font-bold text-ink">Transaksi Berhasil</h2>
                  <p className="text-sm text-muted mt-1">{success.invoice_no}</p>

                  <div className="bg-slate-50 border border-line rounded-xl p-4 mt-4 text-left space-y-1.5">
                    {success.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-muted truncate mr-2">{it.nama} x{it.qty}</span>
                        <span className="text-ink font-medium shrink-0">{rupiah(it.subtotal)}</span>
                      </div>
                    ))}
                    <div className="border-t border-line pt-1.5 mt-1.5">
                      {success.diskon > 0 && (
                        <div className="flex justify-between text-xs text-muted">
                          <span>Diskon</span><span>-{rupiah(success.diskon)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold text-ink mt-1">
                        <span>Total</span><span>{rupiah(success.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 bg-[#234C6A]/5 border border-[#234C6A]/20 rounded-xl p-4">
                    <div className="text-xs text-muted">Kembalian</div>
                    <div className="text-3xl font-bold mt-1" style={{ color: '#234C6A' }}>
                      {rupiah(success.kembalian)}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={resetCheckout}
                      className="flex-1 py-2.5 rounded-lg border border-line text-sm font-medium text-muted hover:bg-slate-50 transition"
                    >
                      Selesai
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold transition"
                      style={{ backgroundColor: '#234C6A' }}
                    >
                      <Printer className="w-4 h-4" />
                      Cetak Struk
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Form bayar ── */
                <>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                    <h2 className="text-base font-semibold text-ink">Pembayaran</h2>
                    <button
                      onClick={() => setCheckoutOpen(false)}
                      className="p-1.5 rounded-lg text-muted hover:bg-slate-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Ringkasan item */}
                    <div className="bg-slate-50 border border-line rounded-xl p-3 space-y-1.5 max-h-36 overflow-y-auto">
                      {cart.items.map((it) => (
                        <div key={it.product.id} className="flex justify-between text-xs">
                          <span className="text-muted truncate mr-2">{it.product.nama} x{it.qty}</span>
                          <span className="text-ink font-medium shrink-0">{rupiah(it.harga * it.qty)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Diskon */}
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">Diskon (Rp)</label>
                      <input
                        type="number"
                        value={diskon || ''}
                        onChange={(e) => setDiskon(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full border border-line rounded-lg px-3 py-2.5 text-sm text-ink
                          focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10"
                      />
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between py-3 border-t border-b border-line">
                      <span className="text-sm text-muted">Total</span>
                      <span className="text-xl font-bold text-ink">{rupiah(total)}</span>
                    </div>

                    {/* Bayar */}
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">Uang Bayar</label>
                      <input
                        type="number"
                        value={bayar || ''}
                        onChange={(e) => setBayar(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        autoFocus
                        className="w-full border border-line rounded-lg px-3 py-2.5 text-sm text-ink
                          focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10"
                      />
                      {/* Quick amount */}
                      <div className="flex gap-2 mt-2">
                        {quickAmounts.map((a) => (
                          <button
                            key={a}
                            onClick={() => setBayar(a)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                              bayar === a
                                ? 'border-[#234C6A] text-[#234C6A] bg-[#234C6A]/5'
                                : 'border-line text-muted hover:border-slate-300'
                            }`}
                          >
                            {rupiah(a)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Kembalian preview */}
                    {bayar > 0 && (
                      <div className={`rounded-xl p-3 text-center ${
                        kembalian < 0
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-emerald-50 border border-emerald-200'
                      }`}>
                        <div className="text-xs text-muted mb-0.5">
                          {kembalian < 0 ? 'Kurang' : 'Kembalian'}
                        </div>
                        <div className={`text-xl font-bold ${kembalian < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {rupiah(Math.abs(kembalian))}
                        </div>
                      </div>
                    )}

                    {/* Tombol bayar */}
                    <button
                      onClick={handleBayar}
                      disabled={paying || bayar < total}
                      className="w-full py-3 rounded-lg text-white font-semibold text-sm transition disabled:opacity-50"
                      style={{ backgroundColor: '#234C6A' }}
                      onMouseEnter={(e) => !paying && bayar >= total && (e.currentTarget.style.backgroundColor = '#1e435e')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#234C6A')}
                    >
                      {paying
                        ? <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Memproses...
                          </span>
                        : `Bayar ${rupiah(total)}`}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}