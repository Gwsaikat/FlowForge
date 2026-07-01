import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AnimatedBackground from '../components/ui/AnimatedBackground.jsx';
import { activateRecruiterDemo } from '../demo/demoApi.js';
import { DEMO_PROJECT_ID } from '../demo/demoData.js';
import { loginUser } from '../services/authService.js';
import { useAuthStore } from '../store/useAuthStore.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setAccessToken } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user, accessToken } = await loginUser({ email, password });
      setUser(user);
      setAccessToken(accessToken);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function launchDemo() {
    activateRecruiterDemo();
    toast.success('Demo mode — no login required');
    navigate(`/projects/${DEMO_PROJECT_ID}`);
  }

  return (
    <div className="auth-page">
      <AnimatedBackground />
      <motion.div
        className="auth-card glass-card"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="auth-back">← FlowForge</Link>
        <h1>Welcome back</h1>
        <p>Sign in to your orchestration engine</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <motion.button type="submit" className="btn btn-primary btn-full" disabled={loading} whileTap={{ scale: 0.98 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </form>
        <button type="button" className="btn btn-demo btn-full" onClick={launchDemo}>
          ⚡ Try Live Demo (no login)
        </button>
        <p className="auth-footer">
          No account? <Link to="/register">Register</Link>
        </p>
      </motion.div>
    </div>
  );
}
