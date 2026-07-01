import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { getAIStandup } from '../../services/aiService.js';

export default function StandupPanel({ projectId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAIStandup(projectId).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [projectId]);

  function copy() {
    navigator.clipboard.writeText(data?.brief || '');
    toast.success('Copied to clipboard');
  }

  return (
    <motion.div className="ai-panel standup-panel" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <Mic size={20} />
          <h3>Neural Standup Brief</h3>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icon" onClick={copy}><Copy size={16} /></button>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>
      </div>
      {loading ? (
        <div className="ai-loading"><div className="spinner" /><span>Generating from live graph...</span></div>
      ) : (
        <div className="ai-panel-body ai-markdown standup-content">
          <ReactMarkdown>{data?.brief}</ReactMarkdown>
        </div>
      )}
    </motion.div>
  );
}
