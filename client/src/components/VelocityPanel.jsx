import { useEffect, useState } from 'react';
import { getProjectDeadline } from '../services/projectService.js';

export default function VelocityPanel({ projectId }) {
  const [drifts, setDrifts] = useState([]);

  useEffect(() => {
    getProjectDeadline(projectId)
      .then((d) => setDrifts(d.assigneeDrifts || []))
      .catch(() => {});
  }, [projectId]);

  if (!drifts.length) return null;

  return (
    <div className="panel">
      <h4>Team Velocity</h4>
      {drifts.map((m) => {
        let icon = '✅ On target';
        if (m.drift > 1.1) icon = `⚠️ +${Math.round((m.drift - 1) * 100)}% over estimates`;
        else if (m.drift < 0.9) icon = '🚀 Finishing early';
        return (
          <div key={m.userId} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
            <span>{m.name}</span>
            <span>{m.drift.toFixed(1)}x {icon}</span>
          </div>
        );
      })}
    </div>
  );
}
