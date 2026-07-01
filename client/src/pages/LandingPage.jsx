import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Sparkles, Ghost, GitBranch, ArrowRight, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedBackground from '../components/ui/AnimatedBackground.jsx';
import { activateRecruiterDemo } from '../demo/demoApi.js';
import { DEMO_PROJECT_ID } from '../demo/demoData.js';

const features = [
  { icon: Zap, title: 'CPM Engine', desc: '5 graph algorithms from scratch — topological sort to cascade BFS', color: 'blue' },
  { icon: Ghost, title: 'Ghost Critical Path', desc: 'World-first: predict tasks that will silently join the critical path', color: 'purple' },
  { icon: Sparkles, title: 'AI Graph Advisor', desc: 'LangChain-powered intelligence on your live dependency graph', color: 'green' },
  { icon: GitBranch, title: 'Semantic Dependency Radar', desc: 'Detect hidden task links your team forgot to draw', color: 'orange' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  function launchDemo() {
    setLoading(true);
    activateRecruiterDemo();
    toast.success('Welcome — explore the full app, no signup needed!');
    navigate(`/projects/${DEMO_PROJECT_ID}`);
    setLoading(false);
  }

  return (
    <div className="landing">
      <AnimatedBackground />

      <nav className="landing-nav">
        <motion.span className="landing-logo" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          ⚡ FlowForge
        </motion.span>
        <div className="landing-nav-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </nav>

      <section className="landing-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="landing-badge">Real-Time Critical Path Intelligence</span>
          <h1>
            Know which tasks will
            <span className="gradient-text"> kill your deadline</span>
            <br />before they do
          </h1>
          <p className="landing-subtitle">
            The only project orchestration engine that combines CPM graph algorithms,
            real-time WebSocket sync, and LangChain AI — with features no other tool on earth has built.
          </p>
          <div className="landing-cta">
            <motion.button
              className="btn btn-hero"
              onClick={launchDemo}
              disabled={loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play size={18} />
              {loading ? 'Loading...' : 'Launch Live Demo'}
              <ArrowRight size={18} />
            </motion.button>
          </div>
          <p className="landing-demo-hint">No login · No signup · Instant access for recruiters</p>
        </motion.div>

        <motion.div
          className="landing-preview"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="preview-window">
            <div className="preview-dots"><span /><span /><span /></div>
            <div className="preview-graph">
              {['Research', 'Design', 'Backend', 'CPM Engine', 'AI Layer', 'Deploy'].map((n, i) => (
                <motion.div
                  key={n}
                  className={`preview-node ${i >= 2 && i <= 4 ? 'critical' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  {n}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="landing-features">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className={`glass-card glow-${f.color} feature-card`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -6 }}
          >
            <f.icon size={28} />
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </motion.div>
        ))}
      </section>

      <footer className="landing-footer">
        <p>Built with React Flow · LangChain · Socket.io · MongoDB · Custom CPM Algorithms</p>
      </footer>
    </div>
  );
}
