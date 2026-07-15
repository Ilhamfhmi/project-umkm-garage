import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, X, Plus, Minus,
  ChevronLeft, CheckCircle2, Printer,
  Package, Droplets, Circle, Zap,
  Tag, Filter, ArrowRight,
} from 'lucide-react';
import { getCategories } from '../api/category';
import { getBrands, type Brand } from '../api/brand';
import { searchProducts } from '../api/product';
import { useCart } from '../store/cart';
import { rupiah } from '../lib/format';
import { toast } from '../store/toast';
import { checkout } from '../api/sale';
import { useAuth } from '../store/auth';
import type { Category, Product } from '../types';

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

// Ikon per kategori
const CAT_ICON: Record<string, any> = {
  'Oli Mesin': Droplets,
  'Oli Gear':  Zap,
  'Ban':       Circle,
  'ATF & CVT': Package,
};

// Warna per kategori
const CAT_COLOR: Record<string, { bg: string; text: string; light: string }> = {
  'Oli Mesin': { bg: '#234C6A', text: 'white',    light: '#EEF3F8' },
  'Oli Gear':  { bg: '#0F766E', text: 'white',    light: '#F0FDFA' },
  'Ban':       { bg: '#7C3AED', text: 'white',    light: '#F5F3FF' },
  'ATF & CVT': { bg: '#B45309', text: 'white',    light: '#FFFBEB' },
};

// Sub-filter per kategori
const SUB_FILTERS: Record<string, string[]> = {
  'Oli Mesin': ['Semua', '1L ke bawah', '4L - 5L', '10L ke atas'],
  'Oli Gear':  ['Semua'],
  'Ban':       ['Semua', 'Ban Luar', 'Ban Dalam'],
  'ATF & CVT': ['Semua', 'ATF', 'CVT'],
};

type Level = 'kategori' | 'merek' | 'produk';

const pageVariants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 1.02 },
};

export default function Kasir() {
  const user = useAuth((s) => s.user);
  const cart = useCart();

  // ── Navigasi ──
  const [level, setLevel] = useState<Level>('kategori');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands]         = useState<Brand[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);

  const [activeCat,   setActiveCat]   = useState<Category | null>(null);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [activeSub,   setActiveSub]   = useState('Semua');

  // ── Search ──
  const [search,     setSearch]     = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Loading ──
  const [loadingCat,     setLoadingCat]     = useState(true);
  const [loadingBrand,   setLoadingBrand]   = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  // ── Checkout ──
  const [cartOpen,      setCartOpen]      = useState(false);
  const [checkoutOpen,  setCheckoutOpen]  = useState(false);
  const [diskon,        setDiskon]        = useState(0);
  const [bayar,         setBayar]         = useState(0);
  const [paying,        setPaying]        = useState(false);
  const [success,       setSuccess]       = useState<SuccessData | null>(null);

  // Load kategori
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .finally(() => setLoadingCat(false));
  }, []);

  // Load brand saat masuk level merek
  useEffect(() => {
    if (!activeCat || level !== 'merek') return;
    setLoadingBrand(true);
    getBrands(activeCat.id)
      .then(setBrands)
      .finally(() => setLoadingBrand(false));
  }, [activeCat, level]);

  // Load produk saat masuk level produk atau ganti sub-filter
  useEffect(() => {
    if (!activeBrand || level !== 'produk') return;
    setLoadingProduct(true);

    // Sub-filter: filter nama produk
    const searchQ = activeSub === 'Semua' ? ''
      : activeSub === 'ATF'         ? 'ATF'
      : activeSub === 'CVT'         ? 'CVT'
      : activeSub === 'Ban Dalam'   ? 'Dalam'
      : activeSub === 'Ban Luar'    ? 'Luar'
      : '';

    const subKatQ = activeSub === '1L ke bawah' ? '1L ke bawah'
      : activeSub === '4L - 5L'    ? '4L - 5L'
      : activeSub === '10L ke atas'? '10L ke atas'
      : undefined;

    searchProducts(searchQ, activeCat?.id, activeBrand.id, subKatQ)
      .then(setProducts)
      .finally(() => setLoadingProduct(false));
  }, [activeBrand, activeSub, level]);

  // Search mode
  useEffect(() => {
    if (!searchMode || !search.trim()) { if (searchMode) setProducts([]); return; }
    setLoadingProduct(true);
    const t = setTimeout(() => {
      searchProducts(search).then(setProducts).finally(() => setLoadingProduct(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, searchMode]);

  // ── Navigasi functions ──
  function pilihKategori(cat: Category) {
    setActiveCat(cat);
    setActiveBrand(null);
    setActiveSub('Semua');
    setProducts([]);
    setLevel('merek');
  }

  function pilihMerek(b: Brand) {
    setActiveBrand(b);
    setActiveSub('Semua');
    setProducts([]);
    setLevel('produk');
  }

  function backTo(l: Level) {
    setLevel(l);
    if (l === 'kategori') { setActiveCat(null); setActiveBrand(null); }
    if (l === 'merek')    { setActiveBrand(null); setProducts([]); }
  }

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
  }

  function addToCart(p: Product) {
    if (p.stok <= 0) {
      toast.error('Stok habis', `${p.nama} tidak tersedia.`);
      return;
    }
    const existing = cart.items.find((i) => i.product.id === p.id);
    if (existing && existing.qty >= p.stok) {
      toast.error('Stok tidak cukup', `Maksimal ${p.stok} ${p.satuan}.`);
      return;
    }
    cart.addItem(p, 1);  // ← qty = 1, harga dihitung otomatis di store
    toast.success(`${p.nama} ditambahkan`, 'ke keranjang');
  }
  
  const subtotal = cart.subtotal();
  const total    = Math.max(0, subtotal - diskon);
  const kembalian = bayar - total;

  const subFilters = activeCat ? (SUB_FILTERS[activeCat.nama] ?? ['Semua']) : ['Semua'];
  const catColor   = activeCat ? (CAT_COLOR[activeCat.nama] ?? { bg: '#234C6A', text: 'white', light: '#EEF3F8' }) : null;

  async function handleBayar() {
    if (bayar < total) { toast.error('Uang kurang', `Kurang ${rupiah(total - bayar)}`); return; }
    setPaying(true);
    try {
      const snapshot = cart.items.map((it) => ({
        nama: it.product.nama, qty: it.qty, harga: it.harga, subtotal: it.harga * it.qty,
      }));
      const res = await checkout({
        tipe_harga: cart.tipeHarga, bayar, diskon,
        items: cart.items.map((it) => ({ product_id: it.product.id, qty: it.qty })),
      });
      setSuccess({
        invoice_no: res.invoice_no, created_at: res.created_at ?? new Date().toISOString(),
        kasir: user?.name, tipe_harga: cart.tipeHarga, items: snapshot,
        subtotal, diskon, total, bayar, kembalian: parseFloat(res.kembalian),
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
    setSuccess(null); setCheckoutOpen(false); setCartOpen(false);
    setDiskon(0); setBayar(0);
  }

  const quickAmounts = [
    total,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
    Math.ceil(total / 50000) * 50000 + 50000,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total).slice(0, 4);

  return (
    <div className="flex flex-col h-full -m-6 bg-canvas">

      {/* ══ TOP BAR ══ */}
      <div className="bg-white border-b border-line px-4 lg:px-6 py-3 flex items-center gap-3 shrink-0">

        {/* Back button / breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {!searchMode && level !== 'kategori' && (
            <button
              onClick={() => backTo(level === 'produk' ? 'merek' : 'kategori')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-muted
                hover:bg-slate-100 hover:text-ink transition shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Kembali</span>
            </button>
          )}

          {/* Breadcrumb */}
          {!searchMode && (
            <div className="flex items-center gap-1 text-xs text-muted min-w-0 overflow-hidden">
              <button
                onClick={() => backTo('kategori')}
                className={`shrink-0 hover:text-ink transition ${level === 'kategori' ? 'font-semibold text-ink' : ''}`}
              >
                Kasir
              </button>
              {activeCat && (
                <>
                  <span className="text-slate-300">/</span>
                  <button
                    onClick={() => backTo('merek')}
                    className={`shrink-0 hover:text-ink transition truncate max-w-[80px] ${level === 'merek' ? 'font-semibold text-ink' : ''}`}
                  >
                    {activeCat.nama}
                  </button>
                </>
              )}
              {activeBrand && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="font-semibold text-ink truncate max-w-[80px]">{activeBrand.nama}</span>
                </>
              )}
            </div>
          )}

          {/* Search input */}
          {searchMode && (
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk apa saja..."
                className="w-full border-2 border-[#234C6A] rounded-lg pl-10 pr-4 py-2 text-sm text-ink
                  focus:outline-none focus:ring-2 focus:ring-[#234C6A]/10 placeholder:text-slate-400 bg-white"
              />
            </div>
          )}
        </div>

        {/* Tipe harga */}
        <div className="flex bg-slate-100 rounded-lg p-0.5 shrink-0">
          {(['umum', 'mitra'] as const).map((t) => (
            <button
              key={t}
              onClick={() => cart.setTipeHarga(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                cart.tipeHarga === t ? 'text-white shadow-sm' : 'text-muted hover:text-ink'
              }`}
              style={cart.tipeHarga === t ? { backgroundColor: '#234C6A' } : {}}
            >
              <Tag className="w-3 h-3" />
              {t}
            </button>
          ))}
        </div>

        {/* Search toggle */}
        {!searchMode ? (
          <button
            onClick={enterSearch}
            className="p-2 rounded-lg text-muted hover:bg-slate-100 hover:text-ink transition shrink-0"
            title="Cari produk"
          >
            <Search className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={exitSearch}
            className="px-3 py-1.5 text-xs font-medium text-muted hover:text-red-600 transition shrink-0"
          >
            Batal
          </button>
        )}

        {/* Cart */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition shrink-0"
          style={{ backgroundColor: '#234C6A' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e435e')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#234C6A')}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">Keranjang</span>
          {cart.items.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px]
              font-bold rounded-full flex items-center justify-center">
              {cart.items.reduce((s, it) => s + it.qty, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Sub-filter bar (hanya di level produk) */}
      {!searchMode && level === 'produk' && subFilters.length > 1 && (
        <div className="bg-white border-b border-line px-4 lg:px-6 py-2.5 flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-hide">
          <Filter className="w-3.5 h-3.5 text-muted shrink-0" />
          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider shrink-0 mr-1">Filter:</span>
          {subFilters.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSub(sub)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition border whitespace-nowrap ${
                activeSub === sub
                  ? 'text-white border-transparent'
                  : 'border-line text-muted hover:border-slate-300 hover:text-ink'
              }`}
              style={activeSub === sub ? { backgroundColor: catColor?.bg ?? '#234C6A' } : {}}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* ══ KONTEN UTAMA ══ */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── Search results ── */}
          {searchMode && (
            <motion.div
              key="search"
              variants={pageVariants}
              initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.18 }}
              className="p-4 lg:p-6"
            >
              {search.trim() && (
                <p className="text-xs text-muted mb-4">
                  {loadingProduct ? 'Mencari...' : `${products.length} hasil untuk "${search}"`}
                </p>
              )}
              {loadingProduct ? (
                <ProductSkeleton />
              ) : products.length === 0 ? (
                <EmptyState
                  icon={<Search className="w-8 h-8 text-slate-300" />}
                  title={search.trim() ? 'Produk tidak ditemukan' : 'Ketik untuk mencari produk'}
                  desc={search.trim() ? `Tidak ada hasil untuk "${search}"` : 'Cari nama produk, merek, atau kategori'}
                />
              ) : (
                <ProductGrid products={products} cart={cart} onAdd={addToCart} />
              )}
            </motion.div>
          )}

          {/* ── Level 1: Kategori ── */}
          {!searchMode && level === 'kategori' && (
            <motion.div
              key="kategori"
              variants={pageVariants}
              initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.18 }}
              className="p-4 lg:p-6"
            >
              <div className="mb-5">
                <h2 className="text-lg font-bold text-ink">Pilih Kategori</h2>
                <p className="text-sm text-muted mt-0.5">Pilih kategori produk yang ingin ditambahkan</p>
              </div>
              {loadingCat ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-36 bg-white border border-line rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {categories.map((cat, i) => {
                    const Icon   = CAT_ICON[cat.nama] ?? Package;
                    const color  = CAT_COLOR[cat.nama] ?? { bg: '#234C6A', text: 'white', light: '#EEF3F8' };
                    return (
                      <motion.button
                        key={cat.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        onClick={() => pilihKategori(cat)}
                        className="group bg-white border-2 border-line rounded-2xl p-6 text-left
                          hover:border-slate-300 hover:shadow-lg transition-all duration-200"
                      >
                        {/* Ikon */}
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4
                            group-hover:scale-110 transition-transform duration-200"
                          style={{ backgroundColor: color.bg }}
                        >
                          <Icon className="w-7 h-7" style={{ color: color.text }} />
                        </div>

                        <h3 className="font-bold text-ink text-base leading-tight">{cat.nama}</h3>
                        {cat.products_count !== undefined && (
                          <p className="text-xs text-muted mt-1">{cat.products_count} produk</p>
                        )}

                        <div className="flex items-center gap-1 mt-3 text-xs font-semibold"
                          style={{ color: color.bg }}>
                          <span>Pilih</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Level 2: Merek ── */}
          {!searchMode && level === 'merek' && activeCat && (
            <motion.div
              key="merek"
              variants={pageVariants}
              initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.18 }}
              className="p-4 lg:p-6"
            >
              {/* Header kategori */}
              <div
                className="rounded-2xl p-5 mb-5 flex items-center gap-4"
                style={{ backgroundColor: catColor?.light ?? '#EEF3F8' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: catColor?.bg ?? '#234C6A' }}
                >
                  {(() => { const Icon = CAT_ICON[activeCat.nama] ?? Package; return <Icon className="w-6 h-6 text-white" />; })()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink">{activeCat.nama}</h2>
                  <p className="text-xs text-muted mt-0.5">Pilih merek yang tersedia</p>
                </div>
              </div>

              {loadingBrand ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-28 bg-white border border-line rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : brands.length === 0 ? (
                <EmptyState
                  icon={<Package className="w-8 h-8 text-slate-300" />}
                  title="Belum ada merek"
                  desc="Belum ada merek terdaftar untuk kategori ini."
                />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {brands.map((b, i) => (
                    <motion.button
                      key={b.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => pilihMerek(b)}
                      className="group bg-white border-2 border-line rounded-2xl p-5 text-left
                        hover:border-slate-300 hover:shadow-md transition-all duration-200"
                    >
                      {/* Avatar merek */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3
                          text-lg font-black group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: catColor?.light ?? '#EEF3F8', color: catColor?.bg ?? '#234C6A' }}
                      >
                        {b.nama.charAt(0)}
                      </div>

                      <h3 className="font-bold text-ink text-sm leading-tight">{b.nama}</h3>
                      {b.products_count !== undefined && (
                        <p className="text-[11px] text-muted mt-0.5">{b.products_count} produk</p>
                      )}

                      <div className="flex items-center gap-1 mt-2.5 text-[11px] font-semibold"
                        style={{ color: catColor?.bg ?? '#234C6A' }}>
                        <span>Lihat produk</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Level 3: Produk ── */}
          {!searchMode && level === 'produk' && activeBrand && (
            <motion.div
              key="produk"
              variants={pageVariants}
              initial="initial" animate="animate" exit="exit"
              transition={{ duration: 0.18 }}
              className="p-4 lg:p-6"
            >
              {/* Header merek */}
              <div
                className="rounded-2xl p-4 mb-4 flex items-center gap-3"
                style={{ backgroundColor: catColor?.light ?? '#EEF3F8' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-black shrink-0"
                  style={{ backgroundColor: catColor?.bg ?? '#234C6A', color: 'white' }}
                >
                  {activeBrand.nama.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-ink">{activeBrand.nama}</h2>
                  <p className="text-xs text-muted">{activeCat?.nama}</p>
                </div>
                <span className="text-xs text-muted shrink-0">{products.length} produk</span>
              </div>

              {loadingProduct ? (
                <ProductSkeleton />
              ) : products.length === 0 ? (
                <EmptyState
                  icon={<Package className="w-8 h-8 text-slate-300" />}
                  title="Belum ada produk"
                  desc="Produk belum tersedia untuk merek dan filter ini."
                />
              ) : (
                <ProductGrid
                  products={products}
                  cart={cart}
                  onAdd={addToCart}
                  accentColor={catColor?.bg}
                />
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ══ PANEL KERANJANG ══ */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: '#234C6A' }}>
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-ink">Keranjang</h2>
                    <p className="text-xs text-muted">
                      {cart.items.length} item · {cart.items.reduce((s, it) => s + it.qty, 0)} qty
                    </p>
                  </div>
                </div>
                <button onClick={() => setCartOpen(false)}
                  className="p-1.5 rounded-lg text-muted hover:bg-slate-100 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-line">
                {cart.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                    <ShoppingCart className="w-10 h-10 text-slate-200 mb-3" />
                    <p className="text-sm text-muted">Keranjang masih kosong.</p>
                  </div>
                ) : (
                  cart.items.map((it) => (
                    <div key={it.product.id}
                      className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{it.product.nama}</div>
                        <div className="text-xs text-muted">{rupiah(it.harga)} / {it.product.satuan}</div>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                        <button onClick={() => cart.updateQty(it.product.id, it.qty - 1)}
                          className="w-7 h-7 rounded-md bg-white flex items-center justify-center
                            border border-line hover:bg-slate-50 transition">
                          <Minus className="w-3 h-3 text-ink" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-ink">{it.qty}</span>
                        <button
                          onClick={() => {
                            if (it.qty >= it.product.stok) {
                              toast.error('Stok tidak cukup', `Maks ${it.product.stok}`); return;
                            }
                            cart.updateQty(it.product.id, it.qty + 1);
                          }}
                          className="w-7 h-7 rounded-md bg-white flex items-center justify-center
                            border border-line hover:bg-slate-50 transition">
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

              {cart.items.length > 0 && (
                <div className="border-t border-line p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Subtotal</span>
                    <span className="text-xl font-bold text-ink">{rupiah(subtotal)}</span>
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
                  <button onClick={() => cart.clear()}
                    className="w-full py-2 text-xs text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    Kosongkan keranjang
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ MODAL CHECKOUT ══ */}
      <AnimatePresence>
        {checkoutOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                <div className="p-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </motion.div>
                  <h2 className="text-lg font-bold text-ink">Transaksi Berhasil</h2>
                  <p className="text-sm text-muted mt-1">{success.invoice_no}</p>

                  <div className="bg-slate-50 border border-line rounded-xl p-4 mt-4 text-left space-y-1.5">
                    {success.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-muted truncate mr-2">{it.nama} x{it.qty}</span>
                        <span className="text-ink font-medium shrink-0">{rupiah(it.subtotal)}</span>
                      </div>
                    ))}
                    <div className="border-t border-line pt-2 mt-2">
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
                    <button onClick={resetCheckout}
                      className="flex-1 py-2.5 rounded-lg border border-line text-sm font-medium text-muted hover:bg-slate-50 transition">
                      Selesai
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                      text-white text-sm font-semibold" style={{ backgroundColor: '#234C6A' }}>
                      <Printer className="w-4 h-4" />
                      Cetak Struk
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                    <h2 className="text-base font-semibold text-ink">Pembayaran</h2>
                    <button onClick={() => setCheckoutOpen(false)}
                      className="p-1.5 rounded-lg text-muted hover:bg-slate-100 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="bg-slate-50 border border-line rounded-xl p-3 space-y-1.5 max-h-36 overflow-y-auto">
                      {cart.items.map((it) => (
                        <div key={it.product.id} className="flex justify-between text-xs">
                          <span className="text-muted truncate mr-2">{it.product.nama} x{it.qty}</span>
                          <span className="text-ink font-medium shrink-0">{rupiah(it.harga * it.qty)}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">Diskon (Rp)</label>
                      <input type="number" value={diskon || ''} onChange={(e) => setDiskon(parseInt(e.target.value) || 0)}
                        placeholder="0" className="w-full border border-line rounded-lg px-3 py-2.5 text-sm text-ink
                          focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10" />
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-b border-line">
                      <span className="text-sm text-muted">Total</span>
                      <span className="text-xl font-bold text-ink">{rupiah(total)}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted mb-1.5">Uang Bayar</label>
                      <input type="number" value={bayar || ''} onChange={(e) => setBayar(parseInt(e.target.value) || 0)}
                        placeholder="0" autoFocus className="w-full border border-line rounded-lg px-3 py-2.5 text-sm text-ink
                          focus:outline-none focus:border-[#234C6A] focus:ring-2 focus:ring-[#234C6A]/10" />
                      <div className="flex gap-2 mt-2">
                        {quickAmounts.map((a) => (
                          <button key={a} onClick={() => setBayar(a)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                              bayar === a ? 'border-[#234C6A] text-[#234C6A] bg-[#234C6A]/5' : 'border-line text-muted hover:border-slate-300'
                            }`}>
                            {rupiah(a)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {bayar > 0 && (
                      <div className={`rounded-xl p-3 text-center ${kembalian < 0 ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                        <div className="text-xs text-muted mb-0.5">{kembalian < 0 ? 'Kurang' : 'Kembalian'}</div>
                        <div className={`text-xl font-bold ${kembalian < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {rupiah(Math.abs(kembalian))}
                        </div>
                      </div>
                    )}

                    <button onClick={handleBayar} disabled={paying || bayar < total}
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

// ── Sub-komponen ──────────────────────────────────────────

function ProductGrid({
  products, cart, onAdd, accentColor = '#234C6A',
}: {
  products: Product[];
  cart: ReturnType<typeof useCart>;
  onAdd: (p: Product) => void;
  accentColor?: string;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {products.map((p, i) => {
        const harga   = cart.tipeHarga === 'mitra' ? parseFloat(p.harga_mitra) : parseFloat(p.harga_umum);
        const habis   = p.stok <= 0;
        const menipis = !habis && p.stok <= p.stok_minimum && p.stok_minimum > 0;
        const inCart  = cart.items.find((it) => it.product.id === p.id);

        return (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.025 }}
            onClick={() => !habis && onAdd(p)}
            disabled={habis}
            className={`relative bg-white rounded-xl p-3 text-left transition-all border-2 group ${
              habis   ? 'opacity-50 cursor-not-allowed border-line' :
              inCart  ? 'shadow-md ring-1'  :
              'border-line hover:border-slate-300 hover:shadow-md'
            }`}
            style={inCart ? { borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}30` } : {}}
          >
            {/* Badge qty */}
            {inCart && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white
                text-[10px] font-bold flex items-center justify-center shadow-md z-10"
                style={{ backgroundColor: accentColor }}>
                {inCart.qty}
              </span>
            )}

            {/* Badge menipis */}
            {menipis && (
              <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full
                bg-amber-500 text-white text-[9px] font-bold z-10">
                Menipis
              </span>
            )}

            {/* Nama */}
            <div className={`text-xs font-semibold leading-tight line-clamp-2 mb-1.5 min-h-[2.5rem] transition-colors
              ${inCart ? '' : 'text-ink group-hover:text-[#234C6A]'}`}
              style={inCart ? { color: accentColor } : {}}>
              {p.nama}
            </div>

            {/* Stok */}
            <div className={`text-[10px] mb-2 ${habis ? 'text-red-500' : menipis ? 'text-amber-600' : 'text-muted'}`}>
              {habis ? 'Stok habis' : `Stok: ${p.stok} ${p.satuan}`}
            </div>

            {/* Harga + tombol */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: accentColor }}>
                {rupiah(harga)}
              </span>
              {!habis && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: accentColor }}>
                  <Plus className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="bg-white border border-line rounded-xl p-3 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-100 rounded w-1/2 mb-3" />
          <div className="h-6 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white border border-line flex items-center justify-center mx-auto mb-4 shadow-sm">
        {icon}
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-muted mt-1 max-w-xs">{desc}</p>
    </div>
  );
}