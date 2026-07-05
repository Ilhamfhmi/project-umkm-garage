import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, Minus, ShoppingCart, X, Trash2, 
  Package, AlertCircle, Check, ShoppingBag, Tag,
  Hash, TrendingDown
} from 'lucide-react';
import { searchProducts } from '../api/product';
import { useCart } from '../store/cart';
import { rupiah } from '../lib/format';
import type { Product } from '../types';
import CheckoutModal from '../components/CheckoutModal';

export default function Kasir() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const cart = useCart();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialLoadDone = useRef(false);

  // Load semua produk saat pertama kali mount
  useEffect(() => {
    async function loadInitialProducts() {
      try {
        setLoading(true);
        const data = await searchProducts('');
        setProducts(data);
        initialLoadDone.current = true;
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    }
    loadInitialProducts();
  }, []);

  // Search dengan debounce (setelah initial load)
  useEffect(() => {
    if (!initialLoadDone.current) return;

    setLoading(true);
    clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchProducts(search);
        setProducts(data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const getQty = useCallback((id: string) => qtyMap[id] ?? 1, [qtyMap]);
  
  const setQty = useCallback((id: string, val: number) => {
    setQtyMap((m) => ({ ...m, [id]: Math.max(1, val) }));
  }, []);

  function handleAdd(product: Product) {
    const qty = getQty(product.id);
    if (qty > product.stok) {
      alert(`Stok ${product.nama} hanya tersedia ${product.stok}`);
      return;
    }
    cart.addItem(product, qty);
    setQty(product.id, 1);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1500);
    setCartOpen(true);
  }

  const totalItem = cart.items.reduce((s, it) => s + it.qty, 0);
  const hasItems = cart.items.length > 0;
  const subtotal = cart.subtotal();

  // Keyboard shortcut (hanya sebagai tambahan)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+F / Cmd+F untuk fokus search (shortcut tambahan)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // Escape untuk tutup cart panel
      if (e.key === 'Escape' && cartOpen) {
        setCartOpen(false);
      }
      // Escape untuk clear search jika sedang fokus
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current && search) {
        setSearch('');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cartOpen, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: '#234C6A' }}
            >
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kasir</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {products.length} produk tersedia
              </p>
            </div>
          </div>

          {/* Price Type Toggle & Cart Button */}
          <div className="flex items-center gap-3">
            {/* Tipe Harga Selector */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <span className="text-xs font-medium text-slate-500 pl-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Harga
              </span>
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                {(['umum', 'mitra'] as const).map((t) => (
                  <motion.button
                    key={t}
                    onClick={() => cart.setTipeHarga(t)}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-4 py-2 rounded-md text-xs font-medium capitalize transition-all duration-200 ${
                      cart.tipeHarga === t
                        ? 'text-white'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {cart.tipeHarga === t && (
                      <motion.div
                        layoutId="priceTypeBg"
                        className="absolute inset-0 rounded-md shadow-sm"
                        style={{ backgroundColor: '#234C6A' }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10">{t}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Cart Button (Desktop) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCartOpen(true)}
              className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 
                rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 hover:shadow-sm 
                transition-all"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4" />
                {totalItem > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] 
                      font-bold rounded-full flex items-center justify-center"
                  >
                    {totalItem}
                  </motion.span>
                )}
              </div>
              <span>{rupiah(subtotal)}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Search Bar - BISA LANGSUNG DIKLIK & DIKETIK */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <div 
            className={`relative transition-all duration-300 ${
              searchFocused ? 'scale-[1.01]' : ''
            }`}
            onClick={() => {
              // Saat search bar diklik, fokus ke input
              searchInputRef.current?.focus();
            }}
          >
            <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
              searchFocused ? 'ring-2 ring-offset-2 opacity-100' : 'opacity-0'
            }`} 
            style={{ 
              ringColor: '#234C6A', 
              ringOffsetColor: 'transparent' 
            }} />
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
              searchFocused ? 'text-[#234C6A]' : 'text-slate-400'
            }`} />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Ketik untuk mencari produk..."
              className="w-full bg-white border-2 border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-sm 
                focus:outline-none focus:border-[#234C6A] transition-all duration-300
                placeholder:text-slate-400 text-slate-800 shadow-sm cursor-text"
            />
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => {
                  e.stopPropagation(); // Hentikan propagasi agar tidak trigger fokus
                  setSearch('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg 
                  text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
          
          {/* Search Info */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div>
              {search ? (
                <p className="text-xs text-slate-500">
                  Hasil pencarian "{search}" · {products.length} produk ditemukan
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Menampilkan semua produk · {products.length} produk
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] 
                text-slate-400 font-mono shadow-sm">Esc</kbd>
              <span className="text-[10px] text-slate-400">reset</span>
            </div>
          </div>
        </motion.div>

        {/* Product Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
                  <div className="flex justify-between mb-4">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="w-16 h-5 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                  <div className="h-6 bg-slate-100 rounded w-1/3 mb-4" />
                  <div className="h-3 bg-slate-100 rounded w-1/4 mb-4" />
                  <div className="flex gap-2 mb-3">
                    <div className="h-9 bg-slate-100 rounded-lg w-24" />
                    <div className="h-9 bg-slate-100 rounded-lg flex-1" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 
                flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                {search ? `Tidak ada produk dengan kata kunci "${search}"` : 'Belum ada produk'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {search ? 'Coba kata kunci lain atau' : 'Tambahkan produk terlebih dahulu'}
              </p>
              {search && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSearch('');
                    searchInputRef.current?.focus();
                  }}
                  className="mt-4 px-4 py-2 text-xs font-medium text-white rounded-lg 
                    hover:shadow-md transition-all"
                  style={{ backgroundColor: '#234C6A' }}
                >
                  Tampilkan Semua Produk
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {products.map((p, index) => {
                const harga = parseFloat(cart.tipeHarga === 'mitra' ? p.harga_mitra : p.harga_umum);
                const habis = p.stok <= 0;
                const menipis = !habis && p.stok <= p.stok_minimum && p.stok_minimum > 0;
                const isAdded = addedProductId === p.id;

                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ y: -2 }}
                    className={`group relative bg-white border rounded-xl p-5 transition-all duration-300 ${
                      habis 
                        ? 'border-slate-200 opacity-60' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50'
                    }`}
                  >
                    {/* Stock Status Badge */}
                    {menipis && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1.5 bg-amber-500 text-white text-[10px] 
                            font-semibold px-2.5 py-1 rounded-full shadow-lg"
                        >
                          <TrendingDown className="w-3 h-3" />
                          <span>Menipis</span>
                        </motion.div>
                      </div>
                    )}

                    {/* Product Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2
                          group-hover:text-[#234C6A] transition-colors">
                          {p.nama}
                        </h3>
                        <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                          cart.tipeHarga === 'mitra'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {cart.tipeHarga}
                        </span>
                      </div>
                      {p.category && (
                        <div className="flex items-center gap-1.5">
                          <Hash className="w-3 h-3 text-slate-400" />
                          <p className="text-[11px] text-slate-500 font-medium">
                            {p.category.nama}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <span className="text-xl font-bold text-slate-800">
                        {rupiah(harga)}
                      </span>
                      {p.satuan && (
                        <span className="text-xs text-slate-500 ml-1">/ {p.satuan}</span>
                      )}
                    </div>

                    {/* Stock Info */}
                    <div className="mb-4">
                      {habis ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="text-xs text-red-500 font-medium">Stok habis</span>
                        </div>
                      ) : menipis ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="text-xs text-amber-600 font-medium">
                            Sisa {p.stok} {p.satuan}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Stok: {p.stok} {p.satuan}
                        </span>
                      )}
                    </div>

                    {/* Action Section */}
                    <div className="mt-auto space-y-2.5">
                      {/* Quantity Control */}
                      {!habis && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-slate-50 border border-slate-200 
                            rounded-lg overflow-hidden">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setQty(p.id, getQty(p.id) - 1)}
                              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 
                                transition-colors"
                              disabled={getQty(p.id) <= 1}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </motion.button>
                            <input
                              type="number"
                              value={getQty(p.id)}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                  setQty(p.id, val);
                                }
                              }}
                              className="w-12 bg-transparent text-center text-sm font-semibold 
                                text-slate-800 focus:outline-none"
                              min="1"
                              max={p.stok}
                            />
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setQty(p.id, getQty(p.id) + 1)}
                              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 
                                transition-colors"
                              disabled={getQty(p.id) >= p.stok}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                          <span className="text-xs text-slate-400">{p.satuan}</span>
                        </div>
                      )}

                      {/* Add to Cart Button */}
                      <motion.button
                        onClick={() => handleAdd(p)}
                        disabled={habis}
                        whileTap={!habis ? { scale: 0.98 } : undefined}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 
                          rounded-lg text-sm font-semibold transition-all duration-300 ${
                          isAdded
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : habis
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'text-white shadow-md hover:shadow-lg'
                        }`}
                        style={!isAdded && !habis ? { backgroundColor: '#234C6A' } : undefined}
                        onMouseEnter={(e) => {
                          if (!isAdded && !habis) {
                            e.currentTarget.style.backgroundColor = '#1e435e';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isAdded && !habis) {
                            e.currentTarget.style.backgroundColor = '#234C6A';
                          }
                        }}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Ditambahkan</span>
                          </>
                        ) : habis ? (
                          <>
                            <X className="w-4 h-4" />
                            <span>Stok Habis</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Tambah</span>
                            <span className="text-xs opacity-75">
                              {getQty(p.id)} {p.satuan}
                            </span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Cart Button (Mobile) */}
        <AnimatePresence>
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCartOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 flex items-center gap-3 text-white 
              font-semibold rounded-2xl pl-5 pr-6 py-4 shadow-2xl transition-all z-30"
            style={{ backgroundColor: '#234C6A' }}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {totalItem > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] 
                    font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
                >
                  {totalItem}
                </motion.span>
              )}
            </div>
            <span className="text-sm">{rupiah(subtotal)}</span>
          </motion.button>
        </AnimatePresence>

        {/* Cart Panel */}
        <AnimatePresence>
          {cartOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCartOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl"
              >
                {/* Cart Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#234C6A' }}
                    >
                      <ShoppingCart className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-slate-800">Keranjang</span>
                      {totalItem > 0 && (
                        <span className="text-xs text-slate-500 ml-1">
                          ({totalItem} item)
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCartOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 
                      hover:bg-slate-100 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence>
                    {!hasItems ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-full text-center"
                      >
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center 
                          justify-center mb-4">
                          <ShoppingBag className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-600 mb-1">
                          Keranjang kosong
                        </p>
                        <p className="text-xs text-slate-500">
                          Tambahkan produk untuk memulai
                        </p>
                      </motion.div>
                    ) : (
                      cart.items.map((it) => (
                        <motion.div
                          key={it.product.id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                          whileHover={{ scale: 1.01 }}
                          className="group flex items-center gap-3 bg-slate-50 border border-slate-200 
                            rounded-xl p-3 hover:border-slate-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">
                              {it.product.nama}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {rupiah(it.harga)} / {it.product.satuan || 'item'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-white border border-slate-200 
                            rounded-lg p-0.5">
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => cart.updateQty(it.product.id, it.qty - 1)}
                              className="p-1.5 text-slate-500 hover:text-slate-700 rounded-md 
                                hover:bg-slate-100 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </motion.button>
                            <span className="w-8 text-center text-sm font-semibold text-slate-800">
                              {it.qty}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => cart.updateQty(it.product.id, it.qty + 1)}
                              className="p-1.5 text-slate-500 hover:text-slate-700 rounded-md 
                                hover:bg-slate-100 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </motion.button>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => cart.removeItem(it.product.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 
                              rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                {/* Cart Footer */}
                {hasItems && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="border-t border-slate-200 bg-white p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm text-slate-600">Subtotal</p>
                        <p className="text-[10px] text-slate-400">
                          {totalItem} item
                        </p>
                      </div>
                      <motion.span
                        key={subtotal}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        className="text-xl font-bold text-slate-800"
                      >
                        {rupiah(subtotal)}
                      </motion.span>
                    </div>

                    <div className="space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setCartOpen(false);
                          setCheckoutOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 text-white 
                          font-semibold rounded-xl py-3.5 text-sm transition-all shadow-lg"
                        style={{ backgroundColor: '#234C6A' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e435e'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#234C6A'}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Proses Pembayaran
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (window.confirm('Kosongkan semua item di keranjang?')) {
                            cart.clear();
                          }
                        }}
                        className="w-full text-xs text-slate-500 hover:text-red-600 
                          transition-colors py-2 font-medium"
                      >
                        Kosongkan Keranjang
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Checkout Modal */}
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
        />
      </div>
    </div>
  );
}