import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover }: Props) {
  return (
    <div
      className={`bg-white border border-line rounded-xl shadow-sm shadow-navy-900/[0.03]
        ${hover ? 'hover:border-navy-200 hover:shadow-md transition' : ''} ${className}`}
    >
      {children}
    </div>
  );
}