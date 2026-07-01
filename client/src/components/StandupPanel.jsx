import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, MessageSquare, ExternalLink } from 'lucide-react';
import { getAIStandup } from '../services/aiService.js';

export default function StandupPanel({ projectId, onClose }) {
  const [data, setData] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    getAIStandup(projectId).then(setData).catch(() => {});
  }, [projectId]);

  function handleClose() {
    setIsOpen(false);
    setTimeout(onClose, 300);
  }

  if (!data) return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <Mic size={18} className="text-accent" />
          <h3>Standup Notes</h3>
        </div>
        <button className="icon-btn" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="ai-loading"><div className="spinner" /> <span>Compiling daily standup brief...</span></div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="standup-panel ai-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="ai-panel-header">
            <div className="ai-panel-title">
              <Mic size={18} className="text-accent" />
              <h3>Standup Notes</h3>
              <span className="ai-badge" style={{ background: 'var(--success-muted)', color: 'var(--success)' }}>Today</span>
            </div>
            <button className="icon-btn" onClick={handleClose}>
              <X size={16} />
            </button>
          </div>

          <div className="ai-panel-body">
            <div className="standup-content ai-markdown">
              {data.notes}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost-sm">
                <ExternalLink size={14} style={{ marginRight: 4, display: 'inline' }} />
                Copy to Clipboard
              </button>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: 'var(--text-xs)' }}>
                <MessageSquare size={14} style={{ marginRight: 4, display: 'inline' }} />
                Post to Slack
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
