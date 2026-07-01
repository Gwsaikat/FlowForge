import DPSBadge from './DPSBadge.jsx';

const STATUS_BADGE = {
  pending: 'badge-pending',
  active: 'badge-active',
  blocked: 'badge-blocked',
  delayed: 'badge-delayed',
  done: 'badge-done',
};

export default function TaskListItem({ task, onClick }) {
  return (
    <div
      className={`task-list-item ${task.isCritical ? 'critical' : ''}`}
      onClick={() => onClick(task)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <strong>{task.title}</strong>
        <span className={`badge ${STATUS_BADGE[task.status]}`}>{task.status}</span>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
        {task.duration}d · {task.assignee?.name || 'Unassigned'}
      </div>
      <div style={{ marginTop: 6 }}>
        <DPSBadge dps={task.dps ?? 100} />
      </div>
    </div>
  );
}
