const VARIANTS = {
  pending: 'pill-neutral',
  active: 'pill-info',
  blocked: 'pill-danger',
  delayed: 'pill-warning',
  done: 'pill-success',
  critical: 'pill-critical',
  watch: 'pill-warning',
  ok: 'pill-success',
};

export default function StatusPill({ variant = 'neutral', children, className = '' }) {
  return (
    <span className={`status-pill ${VARIANTS[variant] || 'pill-neutral'} ${className}`}>
      {children}
    </span>
  );
}
