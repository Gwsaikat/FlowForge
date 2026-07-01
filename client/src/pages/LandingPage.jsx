import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { activateRecruiterDemo } from '../demo/demoApi.js';
import { DEMO_PROJECT_ID } from '../demo/demoData.js';
import { Activity, GitMerge, Clock, Zap, Target, Layout, Move, Users, Shield, Rocket, CheckCircle2, ChevronRight, BarChart3, Database, AlertTriangle } from 'lucide-react';
import AnimatedBackground from '../components/ui/AnimatedBackground.jsx';
import Logo from '../components/ui/Logo.jsx';
import { motion } from 'framer-motion';
import { StaggerList, StaggerItem, ScaleIn, SlideIn, GlowCard } from '../components/ui/Motion.jsx';

export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  function handleTryDemo() {
    activateRecruiterDemo();
    navigate(`/projects/${DEMO_PROJECT_ID}`);
  }

  const features = [
    { icon: <Activity />, title: 'Instant Recalculation', desc: 'When a task slips, the system auto-recalculates and shows the exact deadline impact in seconds.' },
    { icon: <GitMerge />, title: 'Parallel Opportunities', desc: 'Stop wasting time working sequentially. The system flags tasks that can run in parallel, saving days of work.' },
    { icon: <Target />, title: 'Realistic Deadlines', desc: 'Does your team always underestimate? FlowForge learns the pattern and automatically predicts a realistic deadline.' },
    { icon: <Shield />, title: 'Blast Radius Tracking', desc: 'Jira cards just turn red. FlowForge shows you exactly which downstream tasks and people are affected by a blocker.' },
    { icon: <Clock />, title: 'Ghost Paths', desc: 'Identify near-critical paths that could derail your project with our proprietary risk AI before they slip.' },
    { icon: <Zap />, title: 'What-If Sandbox', desc: 'Simulate emergency changes in an isolated environment before committing them to the live project.' },
  ];

  return (
    <div className="landing">
      <AnimatedBackground />

      <nav className="landing-nav">
        <Logo size="lg" />
        <div className="landing-nav-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-hero" style={{ padding: '0.65rem 1.25rem', fontSize: 'var(--text-sm)' }}>
              Enter Dashboard <ChevronRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Sign In</Link>
              <Link to="/register" className="btn btn-primary">Start Building</Link>
            </>
          )}
        </div>
      </nav>

      <main>
        <section className="landing-hero">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="landing-badge">Stop guessing your deadlines</div>
            <h1 style={{ fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              Know exactly when<br />you will ship.
            </h1>
            <p className="landing-subtitle" style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '2.5rem' }}>
              When a task slips, don't panic. FlowForge instantly auto-recalculates deadline impacts, flags hidden parallel opportunities, and reveals the exact blast radius of every blocked task.
            </p>
            <div className="landing-cta">
              <Link to={isAuthenticated ? "/dashboard" : "/register"} className="btn btn-hero">
                Launch Workspace <Rocket size={18} />
              </Link>
              <button className="btn btn-demo" onClick={handleTryDemo}>
                Try Live Demo
              </button>
            </div>
            <div className="landing-demo-hint">
              No credit card required. Free tier available.
            </div>
          </motion.div>

          <ScaleIn className="landing-preview" delay={0.2}>
            <div className="preview-window">
              <div className="preview-dots">
                <span />
                <span />
                <span />
              </div>
              <div style={{ padding: '0 0.5rem' }}>
                <h3 style={{ fontSize: 'var(--text-sm)', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Project Topology</h3>
                <div className="preview-graph">
                  <div className="preview-node">Design System</div>
                  <div className="preview-node critical glow-red">API Layer (Critical)</div>
                  <div className="preview-node">Auth Flow</div>
                  <div className="preview-node critical glow-red">DB Schema (Critical)</div>
                  <div className="preview-node">Frontend Routing</div>
                </div>
                
                <div className="preview-stats">
                  <div><CheckCircle2 size={14} className="text-success" /> 24 Tasks</div>
                  <div><AlertTriangle size={14} className="text-danger" /> 0 Blockers</div>
                  <div><Activity size={14} className="text-accent" /> Health: 98%</div>
                </div>
              </div>
            </div>
          </ScaleIn>
        </section>

        <section style={{ padding: '4rem 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontSize: 'var(--text-3xl)' }}>Everything you need.</h2>
            <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Unprecedented tooling for modern engineering teams.</p>
          </div>
          
          <StaggerList className="landing-features">
            {features.map((f, i) => (
              <StaggerItem key={i}>
                <GlowCard className="feature-card">
                  <div className="feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </GlowCard>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>
      </main>

      <footer className="landing-footer">
        <Logo size="sm" style={{ justifyContent: 'center', marginBottom: '1rem' }} />
        <p>Built for teams that ship fast and never compromise.</p>
        <div style={{ marginTop: '1.5rem', opacity: 0.5 }}>
          © {new Date().getFullYear()} FlowForge. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
