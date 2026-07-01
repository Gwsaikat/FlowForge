import { memo } from 'react';
import { motion } from 'framer-motion';
import { Handle, Position } from 'reactflow';
import { AlertCircle } from 'lucide-react';

function TaskNode({ data }) {
  const { task, isHighlighted } = data;
  const initials = task.assignee?.name
    ? task.assignee.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
    : '?';

  let borderColor = '#818CF8'; // Accent
  if (isHighlighted) borderColor = '#FBBF24'; // Warning
  else if (task.isCritical) borderColor = '#EF4444'; // Danger
  else if (task.status === 'done') borderColor = '#10B981'; // Success
  else if (task.status === 'blocked' || task.status === 'delayed') borderColor = '#F59E0B'; // Warning

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, filter: 'blur(8px)' }}
      animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
      whileHover={{ scale: 1.05, y: -2, boxShadow: `0 8px 30px ${borderColor}33` }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        background: 'rgba(20, 20, 30, 0.85)',
        backdropFilter: 'blur(16px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: '12px 16px',
        minWidth: 160,
        fontSize: 12,
        boxShadow: task.isCritical ? `0 0 30px ${borderColor}44, inset 0 0 10px ${borderColor}22` : '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: borderColor, width: 8, height: 8, border: 'none' }} />
      {task.isCritical && (
        <motion.div
          style={{
            position: 'absolute', inset: -1, borderRadius: 12,
            border: `1px solid ${borderColor}`, pointerEvents: 'none',
          }}
          animate={{ opacity: [0, 1, 0], scale: [1, 1.05, 1.1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#F0F0F5', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
        <span>{task.title}</span>
        {task.isCritical && <AlertCircle size={14} color={borderColor} />}
      </div>
      <div style={{ color: '#8B8FA3', marginBottom: 10, fontSize: 11 }}>{task.duration} days</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg, rgba(255,255,255,0.1), transparent)`,
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#F0F0F5'
        }}>{initials}</div>
        <span style={{ 
          color: task.isCritical ? '#FCA5A5' : '#34D399', 
          fontWeight: 600,
          background: task.isCritical ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 10
        }}>
          Float: {task.float}d
        </span>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: borderColor, width: 8, height: 8, border: 'none' }} />
    </motion.div>
  );
}

export default memo(TaskNode);
