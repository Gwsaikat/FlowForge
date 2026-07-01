import toast from 'react-hot-toast';

export default function BlastRadiusPanel({ cascadeResult, onNotify }) {
  if (!cascadeResult) return null;

  const severityColors = {
    critical: 'var(--accent-red)',
    moderate: 'var(--accent-orange)',
    minor: 'var(--accent-green)',
  };

  return (
    <div className="panel" style={{ borderColor: severityColors[cascadeResult.severity] }}>
      <h3 style={{ color: severityColors[cascadeResult.severity] }}>
        ⚠️ Project delayed by {cascadeResult.deadlineShift} days
      </h3>
      <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>
        {cascadeResult.affectedTaskIds?.length || 0} tasks affected
      </p>
      <span
        className="badge"
        style={{
          background: severityColors[cascadeResult.severity],
          color: 'white',
          textTransform: 'uppercase',
        }}
      >
        {cascadeResult.severity}
      </span>
      <button
        className="btn btn-secondary"
        style={{ marginTop: 12, display: 'block' }}
        onClick={() => {
          toast.success('Notifications sent to affected members');
          onNotify?.();
        }}
      >
        Notify All Affected Members
      </button>
    </div>
  );
}
