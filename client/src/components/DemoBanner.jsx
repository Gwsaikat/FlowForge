import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDemoStore } from '../store/useDemoStore.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { Info } from 'lucide-react';
import StatusPill from './ui/StatusPill.jsx';

export default function DemoBanner() {
  const navigate = useNavigate();
  const exitDemo = useDemoStore((s) => s.exitDemo);
  const logout = useAuthStore((s) => s.logout);

  function leaveDemo() {
    exitDemo();
    logout();
    navigate('/');
  }

  return (
    <motion.div
      className="demo-banner flex items-center gap-3 px-4 py-2 bg-accent-subtle border-b border-accent-muted"
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <Info size={16} className="text-accent" />
      <span className="text-sm text-foreground">
        You are exploring the <strong>FlowForge Demo</strong>. Changes are saved locally and will be reset.
      </span>
      <button type="button" className="btn btn-ghost-sm ml-auto" onClick={leaveDemo}>Exit</button>
    </motion.div>
  );
}
