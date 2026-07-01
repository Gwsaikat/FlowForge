import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getAIAdvisor } from '../../services/aiService.js';
import HealthGauge from '../ui/HealthGauge.jsx';

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
    <motion.div
      className="ai-panel"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
    >
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <Sparkles className="ai-icon" size={20} />
          <div>
            <h3>AI Graph Advisor</h3>
            <span className="ai-badge">{data?.aiEnabled ? 'LangChain' : 'Smart Rules'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icon" onClick={load} disabled={loading}><RefreshCw size={16} /></button>
          <button className="btn-icon" onClick={onClose}><span>×</span></button>
        </div>
      </div>

      {loading ? (
        <div className="ai-loading"><div className="spinner" /><span>Analyzing graph topology...</span></div>
      ) : data ? (
        <div className="ai-panel-body">
          <div className="ai-stats-row">
            <HealthGauge score={data.health?.healthScore ?? 0} size={80} />
            <div className="ai-stat-cards">
              <div className="ai-stat"><span className="ai-stat-val">{data.ghostCriticalPath?.ghostTasks?.length ?? 0}</span><span>Ghost Risks</span></div>
              <div className="ai-stat"><span className="ai-stat-val">{data.delayProphet?.[0]?.slipProbability ?? 0}%</span><span>Top Slip Risk</span></div>
              <div className="ai-stat"><span className="ai-stat-val">{data.health?.totalSmells ?? 0}</span><span>Smells</span></div>
            </div>
          </div>
          <div className="ai-markdown">
            <ReactMarkdown>{data.analysis}</ReactMarkdown>
          </div>
          {data.delayProphet?.length > 0 && (
            <div className="ai-prophet-list">
              <h4>🔮 Delay Prophet</h4>
              {data.delayProphet.map((p) => (
                <motion.div key={p.taskId} className="prophet-row" whileHover={{ x: 4 }}>
                  <div className="prophet-bar" style={{ width: `${p.slipProbability}%` }} />
                  <span>{p.title}</span>
                  <span className={`urgency-${p.urgency}`}>{p.slipProbability}%</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="ai-error">Failed to load AI analysis</p>
      )}
    </motion.div>
  );
}
