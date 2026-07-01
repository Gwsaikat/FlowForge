import { memo } from 'react';
import { motion } from 'framer-motion';
import { Handle, Position } from 'reactflow';

function TaskNode({ data }) {
  const { task, isHighlighted } = data;
  const initials = task.assignee?.name
    ? task.assignee.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
    : '?';

  let borderColor = '#4F8EF7';
  if (isHighlighted) borderColor = '#FFD700';
  else if (task.isCritical) borderColor = '#FF4D6D';
  else if (task.status === 'done') borderColor = '#00E5A0';
  else if (task.status === 'blocked' || task.status === 'delayed') borderColor = '#FF8C42';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05, boxShadow: `0 0 24px ${borderColor}44` }}
      style={{
        background: 'rgba(36,41,56,0.9)',
        backdropFilter: 'blur(8px)',
        border: `2px solid ${borderColor}`,
        borderRadius: 10,
        padding: '10px 14px',
        minWidth: 150,
        fontSize: 12,
        boxShadow: task.isCritical ? `0 0 20px ${borderColor}33` : 'none',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: borderColor }} />
      {task.isCritical && (
        <motion.div
          style={{
            position: 'absolute', inset: -2, borderRadius: 12,
            border: `1px solid ${borderColor}`, pointerEvents: 'none',
          }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>{task.title}</div>
      <div style={{ color: '#8892A4', marginBottom: 6 }}>{task.duration}d</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg, ${borderColor}, #9B59B6)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
        }}>{initials}</div>
        <span style={{ color: task.isCritical ? '#FF4D6D' : '#00E5A0', fontWeight: 600 }}>
          Float: {task.float}d
        </span>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: borderColor }} />
    </motion.div>
  );
}

export default memo(TaskNode);
