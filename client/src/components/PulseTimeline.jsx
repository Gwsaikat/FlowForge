import { motion } from 'framer-motion';

export default function PulseTimeline({ tasks }) {
  if (!tasks?.length) return null;

  const maxEft = Math.max(...tasks.map((t) => t.eft || 0), 1);

  return (
    <div className="pulse-timeline">
      <div className="pulse-timeline-header">
        <span>Project Pulse</span>
        <span className="mono">{maxEft}d total</span>
      </div>
      <div className="pulse-timeline-track">
        {tasks.map((task, i) => {
          const left = ((task.est || 0) / maxEft) * 100;
          const width = Math.max(((task.duration || 1) / maxEft) * 100, 2);
          return (
            <motion.div
              key={task._id}
              className={`pulse-bar ${task.isCritical ? 'critical' : ''} ${task.status}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              title={`${task.title}: Day ${task.est}–${task.eft}`}
              whileHover={{ scaleY: 1.3, zIndex: 10 }}
            >
              {task.isCritical && (
                <motion.span
                  className="pulse-glow"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
      <div className="pulse-timeline-labels">
        <span>Day 0</span>
        <span>Day {Math.round(maxEft)}</span>
      </div>
    </div>
  );
}
