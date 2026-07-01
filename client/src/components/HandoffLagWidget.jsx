import { useEffect, useState } from 'react';
import { getHandoffReport } from '../services/projectService.js';

export default function HandoffLagWidget({ projectId }) {
  const [report, setReport] = useState(null);

  useEffect(() => {
    getHandoffReport(projectId).then(setReport).catch(() => {});
  }, [projectId]);

  if (!report || report.handoffCount === 0) return null;

  return (
    <div className="panel">
      <h4>Handoff Lag Report</h4>
      <div style={{ lineHeight: 1.8, fontSize: '0.9rem' }}>
        <div>Total invisible time lost: {report.totalLagDays} days</div>
        <div>Average lag per handoff: {report.avgLagHours} hours</div>
      </div>
      {report.worstHandoffs?.length > 0 && (
        <>
          <h5 style={{ marginTop: 12 }}>Worst Handoffs</h5>
          {report.worstHandoffs.map((h, i) => (
            <div key={i} style={{ fontSize: '0.85rem' }}>
              {h.predecessorTitle} → {h.title}: {h.lagHours} hours
            </div>
          ))}
        </>
      )}
    </div>
  );
}
