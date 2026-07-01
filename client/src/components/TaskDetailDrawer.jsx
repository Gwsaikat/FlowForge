import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateTask, updateTaskStatus, addDependency, removeDependency } from '../services/projectService.js';
import BlastRadiusPanel from './BlastRadiusPanel.jsx';
import DPSBadge from './DPSBadge.jsx';

export default function TaskDetailDrawer({ task, projectId, tasks, members, open, onClose, onUpdated }) {
  const [title, setTitle] = useState(task?.title || '');
  const [duration, setDuration] = useState(task?.duration || 1);
  const [assignee, setAssignee] = useState(task?.assignee?._id || '');
  const [status, setStatus] = useState(task?.status || 'pending');
  const [cascadeResult, setCascadeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newDep, setNewDep] = useState('');

  if (!task) return null;

  async function handleSave() {
    setLoading(true);
    try {
      const updated = await updateTask(projectId, task._id, {
        title,
        duration: Number(duration),
        assignee: assignee || null,
      });
      onUpdated(updated);
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus) {
    setStatus(newStatus);
    setLoading(true);
    try {
      const result = await updateTaskStatus(projectId, task._id, newStatus);
      setCascadeResult(result.cascadeResult);
      onUpdated(result.task);
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Status update failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDep() {
    if (!newDep) return;
    try {
      await addDependency(projectId, task._id, newDep);
      toast.success('Dependency added');
      onUpdated();
      setNewDep('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add dependency');
    }
  }

  async function handleRemoveDep(depId) {
    try {
      await removeDependency(projectId, task._id, depId);
      toast.success('Dependency removed');
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove dependency');
    }
  }

  const deps = (task.dependencies || []).map((d) =>
    typeof d === 'object' ? d : tasks.find((t) => t._id === d)
  ).filter(Boolean);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: open ? 'rgba(0,0,0,0.4)' : 'transparent',
          zIndex: 400,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={onClose}
      />
      <div className={`drawer ${open ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2>Task Details</h2>
          <button className="btn btn-secondary" onClick={onClose}>×</button>
        </div>

        <div className="form-group">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Status</label>
          <select value={status} onChange={(e) => handleStatusChange(e.target.value)}>
            {['pending', 'active', 'blocked', 'delayed', 'done'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Duration (days)</label>
          <input type="number" min={0.5} step={0.5} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Assignee</label>
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ marginBottom: 16 }}>
          Save Changes
        </button>

        <div className="panel">
          <h4>CPM Data</h4>
          <div style={{ fontSize: '0.9rem', lineHeight: 1.8 }}>
            <div>Earliest Start: Day {task.est}</div>
            <div>Earliest Finish: Day {task.eft}</div>
            <div>Latest Start: Day {task.lst}</div>
            <div>Latest Finish: Day {task.lft}</div>
            <div>Float/Slack: {task.float} days</div>
            <div style={{ marginTop: 8 }}>
              {task.isCritical ? '🔴 CRITICAL PATH' : '🟢 Has slack'}
            </div>
            <div style={{ marginTop: 8 }}><DPSBadge dps={task.dps ?? 100} /></div>
          </div>
        </div>

        {(status === 'blocked' || status === 'delayed') && (
          <BlastRadiusPanel cascadeResult={cascadeResult} />
        )}

        <div className="panel">
          <h4>Dependencies</h4>
          {deps.map((d) => (
            <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>{d.title}</span>
              <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => handleRemoveDep(d._id)}>Remove</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <select value={newDep} onChange={(e) => setNewDep(e.target.value)}>
              <option value="">Add dependency...</option>
              {tasks.filter((t) => t._id !== task._id && !deps.some((d) => d._id === t._id)).map((t) => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </select>
            <button className="btn btn-secondary" onClick={handleAddDep}>Add</button>
          </div>
        </div>
      </div>
    </>
  );
}
