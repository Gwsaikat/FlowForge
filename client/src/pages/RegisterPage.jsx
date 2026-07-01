import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { registerUser } from '../services/authService.js';
import toast from 'react-hot-toast';
import AnimatedBackground from '../components/ui/AnimatedBackground.jsx';
import Logo from '../components/ui/Logo.jsx';
import { PageTransition, GlowCard } from '../components/ui/Motion.jsx';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerUser({ name, email, password });
      setToken(res.token);
      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition className="auth-page">
      <AnimatedBackground />
      
      <GlowCard className="auth-card" glow="blue">
        <Link to="/" className="auth-back">
          <ArrowLeft size={16} /> Back to home
        </Link>
        
        <Logo size="lg" style={{ marginBottom: '1.5rem', justifyContent: 'center' }} />
        <h1 className="text-center">Create Account</h1>
        <p className="text-center">Start orchestrating your projects today.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="Jane Doe"
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              minLength={6}
              placeholder="At least 6 characters"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '1rem', padding: '0.75rem' }}>
            <UserPlus size={18} style={{ marginRight: 6 }} />
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </GlowCard>
    </PageTransition>
  );
}
