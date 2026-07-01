import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, X, AlertTriangle, FastForward, CheckCircle } from 'lucide-react';
import { getAIGhostPath } from '../services/aiService.js';

export default function GhostPathPanel({ projectId, onClose }) {
  const [data, setData] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    getAIGhostPath(projectId).then(setData).catch(() => {});
  }, [projectId]);

  function handleClose() {
    setIsOpen(false);
    setTimeout(onClose, 300);
  }

  if (!data) return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <Ghost size={18} className="ghost-icon" />
          <h3>Ghost Paths</h3>
        </div>
        <button className="icon-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="ai-loading"><div className="spinner" /> <span>Detecting hidden critical paths...</span></div>
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
              <Ghost size={18} className="ghost-icon" />
              <h3>Ghost Paths</h3>
              <span className="ai-badge unique">Risk AI</span>
            </div>
            <button className="icon-btn" onClick={handleClose}>
              <X size={16} />
            </button>
          </div>

          <div className="ai-panel-body">
            {data.ghostPaths?.length > 0 ? (
              <>
                <div className="ghost-narrative">
                  These tasks are currently non-critical but have very little float. If they are delayed even slightly, they will become the new critical path and delay the entire project.
                </div>
                
                {data.ghostPaths.map((gp, i) => (
                  <motion.div 
                    key={gp.taskId} 
                    className="ghost-task-card"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="ghost-prob">{gp.probability}%</div>
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {gp.taskTitle}
                      </div>
                      <p>Only {gp.float} days of slack remaining.</p>
                      <div className="ghost-meta">
                        <FastForward size={12} style={{ display: 'inline', marginRight: 4 }} />
                        Could delay project by {gp.potentialDelay} days
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            ) : (
              <div className="ghost-safe">
                <CheckCircle size={32} style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                <p>No ghost paths detected. Your non-critical tasks have sufficient buffer.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
