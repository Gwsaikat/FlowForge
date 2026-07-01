import { useState } from 'react';
import toast from 'react-hot-toast';
import { runSandbox, updateTask } from '../services/projectService.js';

export default function SandboxPanel({ projectId, tasks, onClose, onSimulated }) {
  const [overrides, setOverrides] = useState(
    Object.fromEntries(tasks.map((t) => [t._id, t.duration]))
  );
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSimulate() {
    setLoading(true);
    try {
      const taskOverrides = Object.entries(overrides).map(([taskId, duration]) => ({
        taskId,
        duration: Number(duration),
      }));
      const data = await runSandbox(projectId, taskOverrides);
      setResults(data);
      onSimulated?.(data);
      toast.success('Simulation complete');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!window.confirm('This will update real task durations. Are you sure?')) return;
    for (const task of tasks) {
      if (overrides[task._id] !== task.duration) {
        await updateTask(projectId, task._id, { duration: overrides[task._id] });
      }
    }
    toast.success('Applied to real project');
    onClose();
  }

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>🧪 Sandbox Mode</h3>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '8px 0' }}>
        Changes here don&apos;t affect the real project until you apply them.
      </p>
      {tasks.map((t) => (
        <div key={t._id} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '0.85rem' }}>{t.title} (was {t.duration}d)</div>
          <input
            type="range"
            min={0.5}
            max={30}
            step={0.5}
            value={overrides[t._id]}
            onChange={(e) => setOverrides({ ...overrides, [t._id]: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
          <span style={{ fontSize: '0.85rem' }}>{overrides[t._id]} days</span>
        </div>
      ))}
      <button className="btn btn-primary" onClick={handleSimulate} disabled={loading} style={{ marginTop: 8 }}>
        Run Simulation
      </button>
      {results && (
        <div style={{ marginTop: 12 }}>
          <div>Original: Day {results.original.projectDuration}</div>
          <div>Simulated: Day {results.simulated.projectDuration} {results.impact.deadlineShift > 0 && `⚠️ +${results.impact.deadlineShift}`}</div>
          {results.impact.criticalPathChanged && <div>Critical path changed!</div>}
          <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={handleApply}>
            Apply to Real Project?
          </button>
        </div>
      )}
    </div>
  );
}
