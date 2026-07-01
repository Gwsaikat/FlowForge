import toast from 'react-hot-toast';
import StatusPill from './ui/StatusPill.jsx';

export default function BlastRadiusPanel({ cascadeResult, onNotify }) {
  if (!cascadeResult) return null;

  const variant = cascadeResult.severity === 'critical' ? 'critical' : cascadeResult.severity === 'moderate' ? 'watch' : 'ok';

  return (
    <div className="panel blast-panel">
      <div className="blast-header">
        <h3>Blast radius</h3>
        <StatusPill variant={variant}>{cascadeResult.severity}</StatusPill>
      </div>
      <p className="blast-impact">
        Project delayed by <strong>{cascadeResult.deadlineShift} days</strong>
      </p>
      <p className="text-secondary blast-meta">
        {cascadeResult.affectedTaskIds?.length || 0} downstream tasks affected
      </p>
      <button
        type="button"
        className="btn btn-secondary btn-full"
        onClick={() => {
          toast.success('Notifications queued for affected members');
          onNotify?.();
        }}
      >
        Notify affected members
      </button>
    </div>
  );
}
