import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDemoStore } from '../store/useDemoStore.js';
import { useAuthStore } from '../store/useAuthStore.js';

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
      className="demo-banner"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <span>🎯 <strong>Recruiter Demo Mode</strong> — no login required · all features unlocked</span>
      <button className="btn btn-ghost-sm" onClick={leaveDemo}>Exit Demo</button>
    </motion.div>
  );
}
