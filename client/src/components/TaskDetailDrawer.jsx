import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, Calendar, User, Clock, AlertTriangle, CheckCircle, Activity, Link2, Info } from 'lucide-react';
import { updateTask, updateTaskStatus, addDependency, removeDependency } from '../services/projectService.js';
import BlastRadiusPanel from './BlastRadiusPanel.jsx';
import DPSBadge from './DPSBadge.jsx';
import StatusPill from './ui/StatusPill.jsx';

export default function TaskDetailDrawer({ task, projectId, tasks, members, open, onClose, onUpdated }) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(1);
  const [assignee, setAssignee] = useState('');
  const [status, setStatus] = useState('pending');
  const [cascadeResult, setCascadeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newDep, setNewDep] = useState('');

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDuration(task.duration || 1);
      setAssignee(task.assignee?._id || task.assignee || '');
      setStatus(task.status || 'pending');
      setCascadeResult(null);
    }
  }, [task]);

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
      toast.success('Task updated successfully');
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
      <div className={`drawer-overlay ${open ? 'open' : ''}`} style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }} onClick={onClose} />
      <div className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>Task Settings</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="form-group">
          <label><Info size={14} style={{ display: 'inline', marginRight: 4 }} /> Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task name..." />
        </div>

        <div className="form-group">
          <label><Activity size={14} style={{ display: 'inline', marginRight: 4 }} /> Status</label>
          <select value={status} onChange={(e) => handleStatusChange(e.target.value)}>
            {['pending', 'active', 'blocked', 'delayed', 'done'].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="cpm-grid">
          <div className="form-group">
            <label><Clock size={14} style={{ display: 'inline', marginRight: 4 }} /> Duration (days)</label>
            <input type="number" min={0.5} step={0.5} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>

          <div className="form-group">
            <label><User size={14} style={{ display: 'inline', marginRight: 4 }} /> Assignee</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m._id || m.id} value={m._id || m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn btn-primary btn-full" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>

        <div className="cpm-data-card">
          <h4>CPM Intelligence</h4>
          <div className="cpm-grid">
            <div className="cpm-stat">
              <div className="cpm-stat-label">Earliest Start</div>
              <div className="cpm-stat-value">Day {task.est}</div>
            </div>
            <div className="cpm-stat">
              <div className="cpm-stat-label">Earliest Finish</div>
              <div className="cpm-stat-value">Day {task.eft}</div>
            </div>
            <div className="cpm-stat">
              <div className="cpm-stat-label">Latest Start</div>
              <div className="cpm-stat-value">Day {task.lst}</div>
            </div>
            <div className="cpm-stat">
              <div className="cpm-stat-label">Latest Finish</div>
              <div className="cpm-stat-value">Day {task.lft}</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <div className="cpm-stat" style={{ flex: 1 }}>
              <div className="cpm-stat-label">Float (Slack)</div>
              <div className="cpm-stat-value" style={{ color: task.float === 0 ? 'var(--danger)' : 'var(--success)' }}>{task.float} days</div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <DPSBadge dps={task.dps ?? 100} />
            </div>
          </div>

          <div className={`cpm-status-indicator ${task.isCritical ? 'cpm-status-critical' : 'cpm-status-safe'}`}>
            <div className={`cpm-status-dot ${task.isCritical ? 'critical' : 'safe'}`} />
            {task.isCritical ? 'On Critical Path' : 'Has scheduling slack'}
          </div>
        </div>

        {(status === 'blocked' || status === 'delayed') && (
          <div style={{ marginTop: 16 }}>
            <BlastRadiusPanel cascadeResult={cascadeResult} />
          </div>
        )}

        <div className="deps-section">
          <h4><Link2 size={14} style={{ display: 'inline', marginRight: 4 }} /> Dependencies</h4>
          {deps.length === 0 && <p className="text-secondary" style={{ fontSize: '0.85rem' }}>No dependencies.</p>}
          {deps.map((d) => (
            <div key={d._id} className="dep-item">
              <span>{d.title}</span>
              <button className="btn btn-ghost-sm" onClick={() => handleRemoveDep(d._id)}>Remove</button>
            </div>
          ))}
          <div className="dep-add-row">
            <select value={newDep} onChange={(e) => setNewDep(e.target.value)} className="form-group" style={{ marginBottom: 0 }}>
              <option value="">Add dependency...</option>
              {tasks.filter((t) => t._id !== task._id && !deps.some((d) => d._id === t._id)).map((t) => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </select>
            <button className="btn btn-secondary" onClick={handleAddDep} disabled={!newDep}>Add</button>
          </div>
        </div>
      </div>
    </>
  );
}
