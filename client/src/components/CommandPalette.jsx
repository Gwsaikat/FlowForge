import { useEffect, useState, useCallback, useRef } from 'react';
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filteredActions = ACTIONS.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTasks = tasks.filter((t) => 
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = [
    ...filteredActions.map(a => ({ type: 'action', ...a })),
    ...filteredTasks.map(t => ({ type: 'task', id: t._id, label: t.title, icon: Zap }))
  ];

  const handleKey = useCallback(
    (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
      if (e.key === 'ArrowUp') setSelectedIndex((i) => Math.max(i - 1, 0));
      if (e.key === 'Enter' && allItems[selectedIndex]) {
        const item = allItems[selectedIndex];
        if (item.type === 'action') onAction(item.id);
        else onAction('open-task', tasks.find(t => t._id === item.id));
        onClose();
      }
    },
    [onClose, allItems, selectedIndex, onAction, tasks]
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
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
              <Search size={18} className="text-secondary" />
              <input
                ref={inputRef}
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              />
              <kbd className="cmd-key">ESC</kbd>
            </div>
            <div className="cmd-list">
              {allItems.map((item, i) => (
                <button
                  key={item.id}
                  className={`cmd-item ${i === selectedIndex ? 'bg-accent-muted' : ''}`}
                  onMouseEnter={() => setSelectedIndex(i)}
                  onClick={() => {
                    item.type === 'action' ? onAction(item.id) : onAction('open-task', tasks.find(t => t._id === item.id));
                    onClose();
                  }}
                >
                  <item.icon size={16} className="text-tertiary" />
                  <span>{item.label}</span>
                  {item.shortcut && <kbd className="cmd-key">{item.shortcut}</kbd>}
                  {i === selectedIndex && <kbd className="cmd-key">↵</kbd>}
                </button>
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
