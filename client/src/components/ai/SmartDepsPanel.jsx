import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAISmartDeps } from '../../services/aiService.js';
import { addDependency } from '../../services/projectService.js';

export default function SmartDepsPanel({ projectId, onClose, onApplied }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    getAISmartDeps(projectId).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [projectId]);

  async function apply(s) {
    setApplying(s.toTaskId + s.fromTaskId);
    try {
      await addDependency(projectId, s.toTaskId, s.fromTaskId);
      toast.success(`Linked: ${s.fromTitle} → ${s.toTitle}`);
      onApplied?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setApplying(null);
    }
  }

  return (
    <motion.div className="ai-panel" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}>
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <GitBranch size={20} />
          <div>
            <h3>Semantic Dependency Radar</h3>
            <span className="ai-badge">{data?.method || 'AI'}</span>
          </div>
        </div>
        <button className="btn-icon" onClick={onClose}>×</button>
      </div>
      {loading ? (
        <div className="ai-loading"><div className="spinner" /><span>Scanning implied dependencies...</span></div>
      ) : (
        <div className="ai-panel-body">
          <p className="ai-subtitle">Hidden links your team forgot to draw — detected by semantic analysis</p>
          {data?.suggestions?.length ? data.suggestions.map((s, i) => (
            <motion.div key={i} className="smart-dep-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <div className="smart-dep-flow">
                <span>{s.fromTitle}</span>
                <span className="arrow">→</span>
                <span>{s.toTitle}</span>
              </div>
              <p>{s.reason}</p>
              <div className="smart-dep-footer">
                <span className="confidence">{s.confidence}% confidence</span>
                <button className="btn btn-sm btn-primary" disabled={applying} onClick={() => apply(s)}>
                  <Plus size={14} /> Add Link
                </button>
              </div>
            </motion.div>
          )) : (
            <p className="ghost-safe">No missing dependencies detected 🎯</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
