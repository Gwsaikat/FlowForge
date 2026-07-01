import { useEffect, useState } from 'react';
import { getProjectDeadline } from '../services/projectService.js';

export default function DeadlineWidget({ projectId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getProjectDeadline(projectId).then(setData).catch(() => {});
  }, [projectId]);

  if (!data) return null;

  const diff = data.realisticDuration - data.optimisticDuration;
  const pct = data.optimisticDuration > 0 ? (diff / data.optimisticDuration) * 100 : 0;
  let color = 'var(--accent-green)';
  if (pct >= 20) color = 'var(--accent-red)';
  else if (pct >= 10) color = 'var(--accent-orange)';

  const fmt = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  return (
    <div className="panel" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>OPTIMISTIC DEADLINE</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Day {data.optimisticDuration}</div>
        <div style={{ fontSize: '0.85rem' }}>{fmt(data.optimisticDeadline)}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>REALISTIC DEADLINE</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color }}>Day {data.realisticDuration}</div>
        <div style={{ fontSize: '0.85rem' }}>{fmt(data.realisticDeadline)}</div>
        {diff > 0 && (
          <div style={{ color, fontSize: '0.85rem' }}>↑ +{diff} days based on history</div>
        )}
      </div>
    </div>
  );
}
