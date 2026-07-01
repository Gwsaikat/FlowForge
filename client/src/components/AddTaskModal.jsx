import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { createTask } from '../services/projectService.js';

export default function AddTaskModal({ projectId, tasks, members, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(1);
  const [assignee, setAssignee] = useState('');
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const task = await createTask(projectId, {
        title,
        description,
        duration: Number(duration),
        assignee: assignee || undefined,
        dependencies,
      });
      toast.success('Task created successfully');
      onCreated(task);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  }

  function toggleDep(id) {
    setDependencies((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div className="icon-btn" style={{ background: 'var(--accent-muted)', color: 'var(--accent-hover)' }}><Plus size={20} /></div>
          <h2 style={{ margin: 0 }}>Add New Task</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Design API Schema" required autoFocus />
          </div>
          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief details about the task..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Duration (days)</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Assignee</label>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m._id || m.id} value={m._id || m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {tasks.length > 0 && (
            <div className="form-group">
              <label>Prerequisites (Dependencies)</label>
              <div style={{ maxHeight: 150, overflowY: 'auto', padding: 8, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                {tasks.map((t) => (
                  <label key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={dependencies.includes(t._id)}
                      onChange={() => toggleDep(t._id)}
                    />
                    {t.title}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
