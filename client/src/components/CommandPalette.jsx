import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Zap, Ghost, GitBranch, Mic, X } from 'lucide-react';

const ACTIONS = [
  { id: 'add-task', label: 'Add Task', icon: Zap, shortcut: 'T' },
  { id: 'ai-advisor', label: 'AI Graph Advisor', icon: Sparkles, shortcut: 'A' },
  { id: 'ghost-path', label: 'Ghost Critical Path', icon: Ghost, shortcut: 'G' },
  { id: 'smart-deps', label: 'Smart Dependencies', icon: GitBranch, shortcut: 'D' },
  { id: 'standup', label: 'AI Standup Brief', icon: Mic, shortcut: 'S' },
  { id: 'sandbox', label: 'What-If Sandbox', icon: Zap, shortcut: 'W' },
  { id: 'health', label: 'Graph Health', icon: Search, shortcut: 'H' },
];

export default function CommandPalette({ open, onClose, onAction, tasks = [] }) {
  const [query, setQuery] = useState('');

  const filtered = ACTIONS.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleKey = useCallback(
    (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [open, handleKey]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cmd-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="cmd-palette"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cmd-search">
              <Search size={18} />
              <input
                autoFocus
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>ESC</kbd>
            </div>
            <div className="cmd-list">
              {filtered.map((action, i) => (
                <motion.button
                  key={action.id}
                  className="cmd-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => { onAction(action.id); onClose(); }}
                >
                  <action.icon size={16} />
                  <span>{action.label}</span>
                  <kbd>{action.shortcut}</kbd>
                </motion.button>
              ))}
              {query && tasks.filter((t) => t.title.toLowerCase().includes(query.toLowerCase())).map((task) => (
                <motion.button
                  key={task._id}
                  className="cmd-item"
                  onClick={() => { onAction('open-task', task); onClose(); }}
                >
                  <Zap size={16} />
                  <span>{task.title}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return { open, setOpen };
}
