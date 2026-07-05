import type { ReactNode } from 'react';

interface Props {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  icon?: ReactNode;
  required?: boolean;
  autoFocus?: boolean;
  min?: number;
  max?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
}

export default function Input({
  label, value, onChange, type = 'text', placeholder, icon,
  required, autoFocus, min, max, onKeyDown, className = '',
}: Props) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-muted mb-1.5">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          min={min}
          max={max}
          onKeyDown={onKeyDown}
          className={`w-full bg-white border border-line rounded-lg py-2.5 text-sm text-ink
            placeholder:text-slate-400 transition
            focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/10
            ${icon ? 'pl-10 pr-3' : 'px-3'}`}
        />
      </div>
    </div>
  );
}