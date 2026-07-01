/**
 * Deadline Pressure Score badge with color coding.
 */
export default function DPSBadge({ dps }) {
  let label = 'OK';
  let className = 'badge badge-done';

  if (dps <= 30) {
    label = 'HIGH PRESSURE';
    className = 'badge badge-blocked';
  } else if (dps <= 60) {
    label = 'WATCH';
    className = 'badge badge-delayed';
  }

  return (
    <span className={className} title={`Deadline Pressure: ${dps}/100`}>
      {dps} — {label}
    </span>
  );
}
