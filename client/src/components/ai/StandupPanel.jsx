import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { getAIStandup } from '../../services/aiService.js';
import IconButton from '../ui/IconButton.jsx';

export default function StandupPanel({ projectId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAIStandup(projectId).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [projectId]);

  function copy() {
    try {
      navigator.clipboard.writeText(data?.brief || '');
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy not supported on this device');
    }
  }

  return (
    <motion.div className="ai-panel standup-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="ai-panel-header">
        <div className="ai-panel-title"><Mic size={20} /><h3>Standup brief</h3></div>
        <div className="panel-actions">
          <button type="button" className="icon-btn" onClick={copy} aria-label="Copy"><Copy size={16} /></button>
          <IconButton onClick={onClose} />
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
