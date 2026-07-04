import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, ShoppingCart, X, Trash2, Package, AlertCircle, Check } from 'lucide-react';
import { searchProducts } from '../api/product';
import { useCart } from '../store/cart';
import { rupiah } from '../lib/format';
import type { Product } from '../types';
import CheckoutModal from '../components/CheckoutModal';

export default function Kasir() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const cart = useCart();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchProducts(search);
        setProducts(data);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const getQty = (id: string) => qtyMap[id] ?? 1;
  const setQty = (id: string, val: number) =>
    setQtyMap((m) => ({ ...m, [id]: Math.max(1, val) }));

  function handleAdd(product: Product) {
    const qty = getQty(product.id);
    if (qty > product.stok) {
      alert(`Stok ${product.nama} cuma ${product.stok}`);
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

  return (
    <div className="relative min-h-screen bg-zinc-950">
      {/* Background gradient untuk depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-transparent to-amber-900/10 pointer-events-none" />
      
      <div className="relative p-4 lg:p-6">
        {/* Header Section - Enhanced */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                  Kasir
                </h1>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Cari produk & tambahkan ke keranjang
                </p>
              </div>
            </div>
          </div>

          {/* Price Type Toggle - Enhanced */}
          <div className="flex items-center gap-3 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-1.5">
            <span className="text-xs text-zinc-400 pl-2">Tipe Harga</span>
            <div className="flex bg-zinc-800/50 rounded-lg p-0.5">
              {(['umum', 'mitra'] as const).map((t) => (
                <motion.button
                  key={t}
                  onClick={() => cart.setTipeHarga(t)}
                  whileTap={{ scale: 0.95 }}
                  className={`relative px-4 py-2 rounded-md text-xs font-medium capitalize transition-all duration-200 ${
                    cart.tipeHarga === t
                      ? 'text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cart.tipeHarga === t && (
                    <motion.div
                      layoutId="priceTypeBg"
                      className="absolute inset-0 bg-amber-500 rounded-md"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{t}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Search Bar - Enhanced */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-400 transition-colors" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk berdasarkan nama..."
              className="w-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 rounded-xl pl-12 pr-12 py-3 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-zinc-600"
            />
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Product Grid - Enhanced */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 border-2 border-amber-500/20 rounded-full animate-ping" />
                  <div className="w-12 h-12 border-2 border-amber-500 rounded-full animate-spin absolute inset-0 border-t-transparent" />
                </div>
                <p className="text-sm text-zinc-500 animate-pulse">Mencari produk...</p>
              </div>
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-400 font-medium">Tidak ada produk ditemukan</p>
              <p className="text-xs text-zinc-600 mt-1">Coba kata kunci lain</p>
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
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -2 }}
                    className={`group relative bg-zinc-900/80 backdrop-blur-sm border rounded-xl p-4 transition-all duration-300 ${
                      habis 
                        ? 'border-zinc-800/50 opacity-60' 
                        : 'border-zinc-800/80 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5'
                    }`}
                  >
                    {/* Stock Status Indicator */}
                    {menipis && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1 bg-orange-500/90 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full shadow-lg"
                        >
                          <AlertCircle className="w-3 h-3" />
                          <span>Menipis</span>
                        </motion.div>
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
                          {p.nama}
                        </h3>
                        <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-medium ${
                          cart.tipeHarga === 'mitra'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {cart.tipeHarga}
                        </span>
                      </div>
                      {p.category && (
                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider">
                          {p.category.nama}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <span className="text-xl font-bold text-amber-400">
                        {rupiah(harga)}
                      </span>
                    </div>

                    {/* Stock Badge */}
                    <div className="mb-4">
                      {habis ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          <span className="text-xs text-red-400 font-medium">Stok habis</span>
                        </div>
                      ) : menipis ? (
                        <span className="text-xs text-orange-400 font-medium">
                          Sisa {p.stok} {p.satuan}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500">
                          Stok: {p.stok} {p.satuan}
                        </span>
                      )}
                    </div>

                    {/* Add to Cart Section */}
                    <div className="mt-auto space-y-2">
                      {/* Quantity Control */}
                      {!habis && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-lg overflow-hidden">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setQty(p.id, getQty(p.id) - 1)}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </motion.button>
                            <input
                              type="number"
                              value={getQty(p.id)}
                              onChange={(e) => setQty(p.id, parseInt(e.target.value) || 1)}
                              className="w-12 bg-transparent text-center text-sm font-medium focus:outline-none"
                              min="1"
                            />
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setQty(p.id, getQty(p.id) + 1)}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                          <span className="text-xs text-zinc-600">{p.satuan}</span>
                        </div>
                      )}

                      {/* Add Button */}
                      <motion.button
                        onClick={() => handleAdd(p)}
                        disabled={habis}
                        whileTap={!habis ? { scale: 0.95 } : undefined}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                          isAdded
                            ? 'bg-emerald-500 text-white'
                            : habis
                            ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                            : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Ditambahkan</span>
                          </>
                        ) : habis ? (
                          <>
                            <X className="w-4 h-4" />
                            <span>Habis</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Tambah ke Keranjang</span>
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

        {/* Floating Cart Button - Enhanced */}
        <AnimatePresence>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 right-6 flex items-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-semibold rounded-2xl pl-4 pr-5 py-3.5 shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all z-30 group"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {totalItem > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
                >
                  {totalItem}
                </motion.span>
              )}
            </div>
            <span className="text-sm">{rupiah(cart.subtotal())}</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              →
            </motion.span>
          </motion.button>
        </AnimatePresence>

        {/* Cart Panel - Enhanced */}
        <AnimatePresence>
          {cartOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCartOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="fixed top-0 right-0 h-full w-full max-w-sm bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800/50 z-50 flex flex-col shadow-2xl"
              >
                {/* Cart Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm">Keranjang</span>
                      {totalItem > 0 && (
                        <span className="text-xs text-zinc-500 ml-1">({totalItem} item)</span>
                      )}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCartOpen(false)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  <AnimatePresence>
                    {!hasItems ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-full text-center"
                      >
                        <div className="w-20 h-20 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-4">
                          <ShoppingCart className="w-10 h-10 text-zinc-600" />
                        </div>
                        <p className="text-sm text-zinc-400 font-medium mb-1">Keranjang kosong</p>
                        <p className="text-xs text-zinc-600">
                          Tambahkan produk untuk memulai transaksi
                        </p>
                      </motion.div>
                    ) : (
                      cart.items.map((it) => (
                        <motion.div
                          key={it.product.id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          whileHover={{ scale: 1.02 }}
                          className="group flex items-center gap-3 bg-zinc-800/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-3 hover:border-zinc-600/50 transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{it.product.nama}</div>
                            <div className="text-xs text-zinc-400 mt-0.5">{rupiah(it.harga)}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-zinc-900/50 rounded-lg p-0.5">
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => cart.updateQty(it.product.id, it.qty - 1)}
                              className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-700/50 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </motion.button>
                            <span className="w-8 text-center text-sm font-medium">
                              {it.qty}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={() => cart.updateQty(it.product.id, it.qty + 1)}
                              className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-700/50 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </motion.button>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => cart.removeItem(it.product.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
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
                    className="border-t border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Total</span>
                      <motion.span
                        key={cart.subtotal()}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-xl font-bold text-amber-400"
                      >
                        {rupiah(cart.subtotal())}
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
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-semibold rounded-xl py-3.5 text-sm transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
                      >
                        Lanjutkan Pembayaran
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (window.confirm('Kosongkan keranjang?')) {
                            cart.clear();
                          }
                        }}
                        className="w-full text-xs text-zinc-500 hover:text-red-400 transition-colors py-2"
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

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}