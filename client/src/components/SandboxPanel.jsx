import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';

export default function SandboxPanel({ tasks, setSandboxState }) {
  const [overrides, setOverrides] = useState({});

  const handleSlider = (taskId, newDuration) => {
    setOverrides((prev) => ({ ...prev, [taskId]: Number(newDuration) }));
  };

  const handleApply = () => setSandboxState(overrides);

  const handleReset = () => {
    setOverrides({});
    setSandboxState(null);
  };

  const hasChanges = Object.keys(overrides).length > 0;

  return (
    <div className="sandbox-panel">
      <div className="panel-intro text-secondary">
        Adjust task durations below to preview their impact on the critical path without saving changes.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 300, overflowY: 'auto', paddingRight: '0.5rem' }}>
        {tasks.map((t) => {
          const val = overrides[t._id] ?? t.duration;
          const isChanged = val !== t.duration;

          return (
            <div key={t._id} className="sandbox-row">
              <div className="sandbox-label" style={{ color: isChanged ? 'var(--accent-hover)' : 'inherit' }}>
                {t.title}
              </div>
              <input
                type="range"
                min={0.5}
                max={Math.max(20, t.duration * 2)}
                step={0.5}
                value={val}
                onChange={(e) => handleSlider(t._id, e.target.value)}
              />
              <span className="mono" style={{ width: 45, textAlign: 'right', color: isChanged ? 'var(--accent-hover)' : 'inherit', fontWeight: isChanged ? 700 : 400 }}>
                {val}d
              </span>
            </div>
          );
        })}
      </div>

      <div className="panel-actions" style={{ marginTop: '1.25rem', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={handleReset} disabled={!hasChanges}>
          <RotateCcw size={14} /> Reset
        </button>
        <button className="btn btn-primary" onClick={handleApply} disabled={!hasChanges}>
          <Play size={14} /> Preview Impact
        </button>
      </div>

      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="sandbox-banner" style={{ borderRadius: 'var(--radius-md)', padding: '0.8rem', border: '1px dashed var(--accent)' }}>
              Unsaved sandbox state active.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
