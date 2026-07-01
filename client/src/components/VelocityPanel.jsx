import { useEffect, useState } from 'react';
import { getProjectDeadline } from '../services/projectService.js';
import StatusPill from './ui/StatusPill.jsx';

export default function VelocityPanel({ projectId }) {
  const [drifts, setDrifts] = useState([]);

  useEffect(() => {
    getProjectDeadline(projectId)
      .then((d) => setDrifts(d.assigneeDrifts || []))
      .catch(() => {});
  }, [projectId]);

  if (!drifts.length) return null;

  return (
    <div className="panel surface velocity-panel">
      <h4>Team velocity</h4>
      {drifts.map((m) => {
        let variant = 'ok';
        let note = 'On target';
        if (m.drift > 1.1) { variant = 'watch'; note = `+${Math.round((m.drift - 1) * 100)}% over`; }
        else if (m.drift < 0.9) { variant = 'ok'; note = 'Ahead of plan'; }

        return (
          <div key={m.userId} className="velocity-row">
            <span>{m.name}</span>
            <span className="velocity-right">
              <span className="mono">{m.drift.toFixed(1)}x</span>
              <StatusPill variant={variant}>{note}</StatusPill>
            </span>
          </div>
        );
      })}
    </div>
  );
}
