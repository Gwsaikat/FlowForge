import { Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function GraphHealthPanel({ tasks }) {
  if (!tasks || tasks.length === 0) return null;

  const total = tasks.length;
  const critical = tasks.filter((t) => t.isCritical).length;
  const delayed = tasks.filter((t) => t.status === 'delayed' || t.status === 'blocked').length;
  const done = tasks.filter((t) => t.status === 'done').length;

  // Basic health heuristic
  let score = 100;
  score -= (critical / total) * 20; // up to 20 pts off for high critical path ratio
  score -= (delayed / total) * 50; // heavily penalize delayed tasks
  score += (done / total) * 10; // small boost for completed tasks
  score = Math.max(0, Math.min(100, Math.round(score)));

  let color = 'var(--success)';
  if (score < 60) color = 'var(--danger)';
  else if (score < 85) color = 'var(--warning)';

  return (
    <div className="panel" style={{ marginTop: '1.25rem' }}>
      <div className="health-summary">
        <div className="health-gauge">
          <svg width="80" height="80" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-primary)" strokeWidth="8" />
            <circle 
              cx="50" cy="50" r="40" fill="none" 
              stroke={color} strokeWidth="8" 
              strokeDasharray="251.2" 
              strokeDashoffset={251.2 - (251.2 * score) / 100}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1.5s var(--ease-out-expo)' }}
            />
          </svg>
          <div className="health-gauge-value" style={{ color }}>{score}</div>
        </div>
        <div>
          <div className="health-score-label">Project Health</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
            {score >= 85 ? 'Healthy and on track.' : score >= 60 ? 'Needs attention.' : 'Critical risks detected.'}
          </div>
        </div>
      </div>

      <div className="health-section">
        <div className="health-item">
          <Activity size={14} className="text-accent" />
          <span>{critical} critical tasks ({Math.round((critical / total) * 100)}%)</span>
        </div>
        <div className="health-item">
          <AlertTriangle size={14} className="text-warning" />
          <span>{delayed} delayed/blocked tasks</span>
        </div>
        <div className="health-item">
          <CheckCircle size={14} className="text-success" />
          <span>{done} completed tasks</span>
        </div>
      </div>

      {score < 100 && (
        <div className="cpm-data-card" style={{ background: 'var(--surface-elevated)', marginTop: '1rem' }}>
          <h4><Info size={14} style={{ display: 'inline', marginRight: 4 }} /> Recommendation</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
            {delayed > 0
              ? 'Resolve blocked tasks immediately to prevent schedule slip.'
              : 'Try running the AI Advisor to find optimization opportunities on the critical path.'}
          </p>
        </div>
      )}
    </div>
  );
}
