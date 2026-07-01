import { useEffect, useState } from 'react';
import { getProjectDeadline } from '../services/projectService.js';
import { Target, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DeadlineWidget({ projectId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getProjectDeadline(projectId).then(setData).catch(() => {});
  }, [projectId]);

  if (!data) return null;

  const diff = data.realisticDuration - data.optimisticDuration;
  const pct = data.optimisticDuration > 0 ? (diff / data.optimisticDuration) * 100 : 0;

  let color = 'var(--success)';
  let StatusIcon = CheckCircle;
  if (pct >= 20) { color = 'var(--danger)'; StatusIcon = AlertTriangle; }
  else if (pct >= 10) { color = 'var(--warning)'; StatusIcon = AlertTriangle; }

  const fmt = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A';

  return (
    <div className="deadline-widget">
      <div className="deadline-stat">
        <div className="deadline-label">
          <Target size={12} style={{ display: 'inline', marginRight: 4 }} /> Optimistic
        </div>
        <div className="deadline-value">Day {data.optimisticDuration}</div>
        <div className="deadline-date">{fmt(data.optimisticDeadline)}</div>
      </div>
      <div className="deadline-stat">
        <div className="deadline-label">
          <Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> Realistic
        </div>
        <div className="deadline-value" style={{ color }}>{data.realisticDuration} days</div>
        {diff > 0 && (
          <div className="deadline-drift" style={{ color }}>
            <StatusIcon size={12} />
            +{diff} days based on history
          </div>
        )}
      </div>
    </div>
  );
}
