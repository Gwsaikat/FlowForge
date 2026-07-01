import DPSBadge, { STATUS_LABELS } from './DPSBadge.jsx';
import StatusPill from './ui/StatusPill.jsx';

export default function TaskListItem({ task, onClick }) {
  return (
    <button type="button" className={`task-list-item ${task.isCritical ? 'critical' : ''}`} onClick={() => onClick(task)}>
      <div className="task-list-top">
        <strong>{task.title}</strong>
        <StatusPill variant={task.status}>{STATUS_LABELS[task.status] || task.status}</StatusPill>
      </div>
      <div className="task-list-meta">
        {task.duration}d · {task.assignee?.name || 'Unassigned'}
      </div>
      <DPSBadge dps={task.dps ?? 100} />
    </button>
  );
}
