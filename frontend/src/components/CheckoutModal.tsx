import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';
import { useCart } from '../store/cart';
import { checkout } from '../api/sale';
import { rupiah } from '../lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ open, onClose }: Props) {
  const cart = useCart();
  const subtotal = cart.subtotal();

  const [diskon, setDiskon] = useState(0);
  const [bayar, setBayar] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ invoice: string; kembalian: number } | null>(null);

  const total = Math.max(0, subtotal - diskon);
  const kembalian = bayar - total;

  async function handleBayar() {
    if (bayar < total) {
      setError('Pembayaran kurang dari total.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await checkout({
        tipe_harga: cart.tipeHarga,
        bayar,
        diskon,
        items: cart.items.map((it) => ({
          product_id: it.product.id,
          qty: it.qty,
        })),
      });
      setSuccess({ invoice: res.invoice_no, kembalian: parseFloat(res.kembalian) });
      cart.clear();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal memproses transaksi.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSuccess(null);
    setDiskon(0);
    setBayar(0);
    setError('');
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl z-50 p-6"
          >
            {success ? (
              <div className="text-center py-4">
                <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-3" />
                <h2 className="text-lg font-bold">Transaksi Berhasil</h2>
                <p className="text-sm text-zinc-500 mt-1">{success.invoice}</p>
                <div className="mt-4 bg-zinc-950 rounded-lg p-4">
                  <div className="text-xs text-zinc-500">Kembalian</div>
                  <div className="text-2xl font-bold text-amber-400">
                    {rupiah(success.kembalian)}
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg py-2.5 text-sm"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Pembayaran</h2>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-3 py-2 mb-3">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtotal</span>
                    <span>{rupiah(subtotal)}</span>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Diskon</label>
                    <input
                      type="number"
                      value={diskon || ''}
                      onChange={(e) => setDiskon(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex justify-between text-sm font-semibold border-t border-zinc-800 pt-3">
                    <span>Total</span>
                    <span className="text-amber-400">{rupiah(total)}</span>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Bayar</label>
                    <input
                      type="number"
                      value={bayar || ''}
                      onChange={(e) => setBayar(parseFloat(e.target.value) || 0)}
                      autoFocus
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                      placeholder="0"
                    />
                  </div>

                  {/* Tombol uang cepat */}
                  <div className="flex gap-2 flex-wrap">
                    {[total, 50000, 100000, 150000, 200000].map((amt, i) => (
                      <button
                        key={i}
                        onClick={() => setBayar(amt)}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg py-1.5 text-xs whitespace-nowrap px-2"
                      >
                        {i === 0 ? 'Uang pas' : rupiah(amt)}
                      </button>
                    ))}
                  </div>

                  {bayar > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Kembalian</span>
                      <span className={kembalian < 0 ? 'text-red-400' : 'text-green-400'}>
                        {rupiah(kembalian)}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={handleBayar}
                    disabled={loading || cart.items.length === 0}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg py-3 text-sm transition disabled:opacity-40"
                  >
                    {loading ? 'Memproses...' : 'Proses Pembayaran'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}