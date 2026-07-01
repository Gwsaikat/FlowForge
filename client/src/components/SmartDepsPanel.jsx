import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getAISmartDeps } from '../services/aiService.js';
import toast from 'react-hot-toast';

export default function SmartDepsPanel({ projectId, onClose }) {
  const [data, setData] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    getAISmartDeps(projectId).then(setData).catch(() => {});
  }, [projectId]);

  function handleClose() {
    setIsOpen(false);
    setTimeout(onClose, 300);
  }

  function applyRecommendation(rec) {
    toast.success('Recommendation applied! (Simulation only)');
    // In a real app, this would call the API to actually add the dependency
  }

  if (!data) return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <Lightbulb size={18} className="text-warning" />
          <h3>Smart Dependencies</h3>
        </div>
        <button className="icon-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="ai-loading"><div className="spinner" /> <span>Analyzing task graph...</span></div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="ai-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="ai-panel-header">
            <div className="ai-panel-title">
              <Lightbulb size={18} className="text-warning" />
              <h3>Smart Dependencies</h3>
              <span className="ai-badge" style={{ background: 'var(--warning-muted)', color: 'var(--warning)' }}>AI Suggestions</span>
            </div>
            <button className="icon-btn" onClick={handleClose}>
              <X size={16} />
            </button>
          </div>

          <div className="ai-panel-body">
            <p className="ai-subtitle">
              Based on historical project patterns and task titles, the AI suggests adding these missing dependencies to improve your schedule accuracy.
            </p>

            {data.recommendations?.length > 0 ? (
              data.recommendations.map((rec, i) => (
                <motion.div 
                  key={i} 
                  className="smart-dep-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="smart-dep-flow">
                    <span>{rec.sourceTitle}</span>
                    <ArrowRight size={14} className="arrow" />
                    <span>{rec.targetTitle}</span>
                  </div>
                  <p>{rec.reason}</p>
                  <div className="smart-dep-footer">
                    <span className="confidence">{rec.confidence}% Match</span>
                    <button className="btn btn-ghost-sm" onClick={() => applyRecommendation(rec)}>
                      Apply
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <CheckCircle2 size={32} className="text-success" style={{ margin: '0 auto 1rem' }} />
                <p>Your graph looks complete! No missing dependencies detected.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
