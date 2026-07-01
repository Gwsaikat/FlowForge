import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import AnimatedBackground from '../components/ui/AnimatedBackground.jsx';
import { logoutUser } from '../services/authService.js';
import { getProjects, createProject } from '../services/projectService.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { useProjectStore } from '../store/useProjectStore.js';
import { StaggerList, StaggerItem, GlowCard } from '../components/ui/Motion.jsx';
import ProjectCard from '../components/ProjectCard.jsx';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { projects, setProjects, addProject } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      setProjects(await getProjects());
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProjects(); }, [setProjects]);

  async function handleLogout() {
    try { await logoutUser(); } catch { /* */ }
    logout();
    navigate('/');
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const project = await createProject({ name, description, deadline: deadline || undefined });
      addProject(project);
      setShowModal(false);
      toast.success('Project created');
      navigate(`/projects/${project._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-bg" />
      <nav className="navbar navbar-glass">
        <motion.span className="navbar-brand" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate('/')}>
          ⚡ FlowForge
        </motion.span>
        <div className="navbar-user">
          <span>{user?.name}</span>
          <button className="btn btn-ghost-sm" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="page-container">
        <motion.div className="dashboard-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <h1>Your Projects</h1>
            <p className="text-secondary">Real-time critical path orchestration</p>
          </div>
          <motion.button className="btn btn-primary" onClick={() => setShowModal(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Plus size={18} /> New Project
          </motion.button>
        </motion.div>

        {loading && <div className="loading-center"><div className="spinner" /></div>}
        {error && (
          <div className="empty-state">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadProjects}>Retry</button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <motion.div className="empty-state glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2>No projects yet</h2>
            <p>Create your first CPM-powered project</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>New Project</button>
          </motion.div>
        )}

        {!loading && !error && projects.length > 0 && (
          <StaggerList className="projects-grid">
            {projects.map((p) => (
              <StaggerItem key={p._id}>
                <GlowCard glow="blue">
                  <ProjectCard project={p} onClick={() => navigate(`/projects/${p._id}`)} />
                </GlowCard>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div className="modal glass-card" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()}>
            <h2>New Project</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="form-group"><label>Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div className="form-group"><label>Deadline</label><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
