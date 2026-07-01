import StatusPill from './ui/StatusPill.jsx';

const LABELS = {
  pending: 'Pending',
  active: 'Active',
  blocked: 'Blocked',
  delayed: 'Delayed',
  done: 'Done',
};

export default function DPSBadge({ dps }) {
  let variant = 'ok';
  let label = 'On track';

  if (dps <= 30) {
    variant = 'critical';
    label = 'High pressure';
  } else if (dps <= 60) {
    variant = 'watch';
    label = 'Watch';
  }

  return (
    <StatusPill variant={variant} className="dps-badge" title={`Deadline pressure: ${dps}/100`}>
      {dps} · {label}
    </StatusPill>
  );
}

export { LABELS as STATUS_LABELS };
