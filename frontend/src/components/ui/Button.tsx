import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface Props {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-navy-500 hover:bg-navy-600 text-white shadow-sm',
  secondary: 'bg-white border border-line text-ink hover:bg-slate-50',
  ghost: 'text-muted hover:bg-slate-100 hover:text-ink',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
};

export default function Button({
  children, onClick, type = 'button', variant = 'primary', size = 'md',
  disabled, loading, className = '', icon, fullWidth,
}: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold rounded-lg transition
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
}