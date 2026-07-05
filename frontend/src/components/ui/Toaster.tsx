import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, type ToastType } from '../../store/toast';

const config: Record<ToastType, { icon: typeof CheckCircle2; color: string; bar: string }> = {
  success: { icon: CheckCircle2, color: 'text-emerald-600', bar: 'bg-emerald-500' },
  error:   { icon: XCircle,      color: 'text-red-600',     bar: 'bg-red-500' },
  warning: { icon: AlertTriangle,color: 'text-amber-600',   bar: 'bg-amber-500' },
  info:    { icon: Info,         color: 'text-navy-600',    bar: 'bg-navy-500' },
};

export default function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const remove = useToast((s) => s.remove);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const c = config[t.type];
          const Icon = c.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="pointer-events-auto bg-white border border-line rounded-lg shadow-lg shadow-navy-900/5 overflow-hidden flex"
            >
              <div className={`w-1 ${c.bar}`} />
              <div className="flex items-start gap-3 p-3.5 flex-1">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${c.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink">{t.title}</div>
                  {t.message && <div className="text-xs text-muted mt-0.5">{t.message}</div>}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="text-slate-400 hover:text-ink transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}