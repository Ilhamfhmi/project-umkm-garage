import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useConfirm } from '../../store/confirm';

export default function ConfirmDialog() {
  const { open, options, handle } = useConfirm();
  const danger = options.danger;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => handle(false)}
            className="fixed inset-0 bg-navy-900/40 backdrop-blur-sm z-[90]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-xl shadow-2xl z-[91] p-6"
          >
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                danger ? 'bg-red-50 text-red-600' : 'bg-navy-50 text-navy-600'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-ink">{options.title}</h3>
                {options.message && (
                  <p className="text-sm text-muted mt-1">{options.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => handle(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-line text-sm font-medium text-ink hover:bg-slate-50 transition"
              >
                {options.cancelText ?? 'Batal'}
              </button>
              <button
                onClick={() => handle(true)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition ${
                  danger ? 'bg-red-600 hover:bg-red-700' : 'bg-navy-500 hover:bg-navy-600'
                }`}
              >
                {options.confirmText ?? 'Ya, lanjutkan'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}