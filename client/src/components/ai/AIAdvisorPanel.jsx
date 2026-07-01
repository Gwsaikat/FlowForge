import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getAIAdvisor } from '../../services/aiService.js';
import HealthGauge from '../ui/HealthGauge.jsx';
import IconButton from '../ui/IconButton.jsx';
import StatusPill from '../ui/StatusPill.jsx';

export default function AIAdvisorPanel({ projectId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setData(await getAIAdvisor(projectId));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [projectId]);

  return (
    <motion.div className="ai-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <Sparkles size={20} className="ai-icon" />
          <div>
            <h3>AI Graph Advisor</h3>
            <StatusPill variant="active">{data?.aiEnabled ? 'LangChain' : 'Rules engine'}</StatusPill>
          </div>
        </div>
        <div className="panel-actions">
          <button type="button" className="icon-btn" onClick={load} disabled={loading} aria-label="Refresh"><RefreshCw size={16} /></button>
          <IconButton onClick={onClose} />
        </div>
      </div>

      {loading ? (
        <div className="ai-loading"><div className="spinner" /><span>Analyzing graph topology...</span></div>
      ) : data ? (
        <div className="ai-panel-body">
          <div className="ai-stats-row">
            <HealthGauge score={data.health?.healthScore ?? 0} size={80} />
            <div className="ai-stat-cards">
              <div className="ai-stat"><span className="ai-stat-val">{data.ghostCriticalPath?.ghostTasks?.length ?? 0}</span><span>Ghost risks</span></div>
              <div className="ai-stat"><span className="ai-stat-val">{data.delayProphet?.[0]?.slipProbability ?? 0}%</span><span>Top slip</span></div>
              <div className="ai-stat"><span className="ai-stat-val">{data.health?.totalSmells ?? 0}</span><span>Smells</span></div>
            </div>
          </div>
          <div className="ai-markdown"><ReactMarkdown>{data.analysis}</ReactMarkdown></div>
          {data.delayProphet?.length > 0 && (
            <div className="ai-prophet-list">
              <h4>Delay prophet</h4>
              {data.delayProphet.map((p) => (
                <div key={p.taskId} className="prophet-row">
                  <div className="prophet-bar" style={{ width: `${p.slipProbability}%` }} />
                  <span>{p.title}</span>
                  <span className={`urgency-${p.urgency}`}>{p.slipProbability}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="ai-error">Failed to load analysis</p>
      )}
    </motion.div>
  );
}
