import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown } from 'lucide-react';
import { getParallelOpportunities } from '../services/projectService.js';
import IconButton from './ui/IconButton.jsx';

export default function OpportunitiesPanel({ projectId, onClose }) {
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    getParallelOpportunities(projectId).then(setOpportunities).catch(() => {});
  }, [projectId]);

  const totalSaved = opportunities.reduce((s, o) => s + o.timeSaved, 0);

  return (
    <motion.div className="panel surface" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="panel-header-row">
        <h3>Parallel opportunities</h3>
        <IconButton onClick={onClose} />
      </div>
      <p className="text-secondary panel-intro">
        {opportunities.length} opportunities · up to {totalSaved} days saved
      </p>
      {opportunities.map((opp, i) => (
        <div key={i} className="opp-card surface">
          <div className="opp-header">
            <TrendingDown size={16} />
            <span>Days {opp.timeWindow.start}–{opp.timeWindow.end}</span>
          </div>
          {opp.tasks.map((t) => (
            <div key={t._id} className="opp-task">{t.title}</div>
          ))}
          <div className="opp-saved">Saves {opp.timeSaved} days</div>
        </div>
      ))}
    </motion.div>
  );
}
