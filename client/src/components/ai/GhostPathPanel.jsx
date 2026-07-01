import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Ghost } from 'lucide-react';
import { getAIGhostPath } from '../../services/aiService.js';
import IconButton from '../ui/IconButton.jsx';
import StatusPill from '../ui/StatusPill.jsx';

export default function GhostPathPanel({ projectId, onClose, onHighlight }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAIGhostPath(projectId).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [projectId]);

  return (
    <motion.div className="ai-panel ghost-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <Ghost size={20} />
          <div>
            <h3>Ghost critical path</h3>
            <StatusPill variant="watch">Predictive</StatusPill>
          </div>
        </div>
        <IconButton onClick={onClose} />
      </div>

      {loading ? (
        <div className="ai-loading"><div className="spinner" /><span>Predicting path shifts...</span></div>
      ) : data ? (
        <div className="ai-panel-body">
          <div className="ghost-risk-meter">
            <span>Shift risk</span>
            <div className="ghost-meter-track">
              <motion.div className="ghost-meter-fill" initial={{ width: 0 }} animate={{ width: `${data.shiftRisk}%` }} />
            </div>
            <span className="mono">{data.shiftRisk}%</span>
          </div>
          <p className="ghost-narrative">{data.narrative}</p>
          {data.ghostTasks?.map((g, i) => (
            <motion.div key={g.taskId} className="ghost-task-card" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="ghost-prob">{g.probability}%</div>
              <div>
                <strong>{g.title}</strong>
                <p>{g.reason}</p>
                <span className="ghost-meta">Float {g.currentFloat}d → {g.projectedFloat?.toFixed?.(1) ?? g.projectedFloat}d</span>
              </div>
            </motion.div>
          ))}
          {data.ghostTasks?.length > 0 ? (
            <button type="button" className="btn btn-primary" onClick={() => onHighlight?.(data.ghostTasks.map((g) => g.taskId))}>
              Highlight in graph
            </button>
          ) : (
            <div className="ghost-safe">Critical path is stable — no ghost shifts predicted</div>
          )}
        </div>
      ) : null}
    </motion.div>
  );
}
