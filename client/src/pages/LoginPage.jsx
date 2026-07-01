import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { loginUser } from '../services/authService.js';
import toast from 'react-hot-toast';
import AnimatedBackground from '../components/ui/AnimatedBackground.jsx';
import Logo from '../components/ui/Logo.jsx';
import { PageTransition, GlowCard } from '../components/ui/Motion.jsx';
import { ArrowLeft, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      setToken(res.token);
      toast.success('Welcome back to FlowForge');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition className="auth-page">
      <AnimatedBackground />
      
      <GlowCard className="auth-card" glow="purple">
        <Link to="/" className="auth-back">
          <ArrowLeft size={16} /> Back to home
        </Link>
        
        <Logo size="lg" style={{ marginBottom: '1.5rem', justifyContent: 'center' }} />
        <h1 className="text-center">Welcome back</h1>
        <p className="text-center">Sign in to orchestrate your projects.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@company.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '1rem', padding: '0.75rem' }}>
            <LogIn size={18} style={{ marginRight: 6 }} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one now</Link>
        </div>
      </GlowCard>
    </PageTransition>
  );
}
