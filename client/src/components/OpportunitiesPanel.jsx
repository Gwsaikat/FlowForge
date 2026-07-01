import { useEffect, useState } from 'react';
import { getParallelOpportunities } from '../services/projectService.js';

export default function OpportunitiesPanel({ projectId, onClose }) {
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    getParallelOpportunities(projectId).then(setOpportunities).catch(() => {});
  }, [projectId]);

  const totalSaved = opportunities.reduce((s, o) => s + o.timeSaved, 0);

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>Parallel Opportunities</h3>
        <button className="btn btn-secondary" onClick={onClose}>×</button>
      </div>
      <p style={{ margin: '0.5rem 0' }}>
        🚀 {opportunities.length} opportunities — save up to {totalSaved} days
      </p>
      {opportunities.map((opp, i) => (
        <div key={i} className="card" style={{ marginTop: 8 }}>
          <strong>Opportunity {i + 1} — Days {opp.timeWindow.start} to {opp.timeWindow.end}</strong>
          {opp.tasks.map((t) => (
            <div key={t._id} style={{ fontSize: '0.85rem', marginTop: 4 }}>
              {t.title} {t.assignee ? `(${t.assignee})` : ''}
            </div>
          ))}
          <div style={{ color: 'var(--accent-green)', marginTop: 4 }}>⚡ Saves {opp.timeSaved} days</div>
        </div>
      ))}
    </div>
  );
}
