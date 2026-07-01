import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAISmartDeps } from '../../services/aiService.js';
import { addDependency } from '../../services/projectService.js';
import IconButton from '../ui/IconButton.jsx';

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
      toast.success(`Linked ${s.fromTitle} → ${s.toTitle}`);
      onApplied?.();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed');
    } finally {
      setApplying(null);
    }
  }

  return (
    <motion.div className="ai-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <GitBranch size={20} />
          <h3>Semantic dependency radar</h3>
        </div>
        <IconButton onClick={onClose} />
      </div>
      {loading ? (
        <div className="ai-loading"><div className="spinner" /><span>Scanning implied dependencies...</span></div>
      ) : (
        <div className="ai-panel-body">
          <p className="ai-subtitle">Hidden links detected from task semantics and workflow patterns</p>
          {data?.suggestions?.length ? data.suggestions.map((s, i) => (
            <div key={i} className="smart-dep-card">
              <div className="smart-dep-flow">
                <span>{s.fromTitle}</span><span className="arrow">→</span><span>{s.toTitle}</span>
              </div>
              <p>{s.reason}</p>
              <div className="smart-dep-footer">
                <span className="confidence">{s.confidence}% confidence</span>
                <button type="button" className="btn btn-sm btn-primary" disabled={applying} onClick={() => apply(s)}>
                  <Plus size={14} /> Add link
                </button>
              </div>
            </div>
          )) : (
            <p className="ghost-safe">No missing dependencies detected</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
