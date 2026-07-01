import { X } from 'lucide-react';

export default function IconButton({ onClick, label = 'Close', children, className = '' }) {
  return (
    <button type="button" className={`icon-btn ${className}`} onClick={onClick} aria-label={label}>
      {children || <X size={18} strokeWidth={2} />}
    </button>
  );
}
