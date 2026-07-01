import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Layout, FolderKanban } from 'lucide-react';
import { getProjects, createProject } from '../services/projectService.js';
import { useAuthStore } from '../store/useAuthStore.js';
import toast from 'react-hot-toast';
import ProjectCard from '../components/ProjectCard.jsx';
import Logo from '../components/ui/Logo.jsx';
import { PageTransition, StaggerList } from '../components/ui/Motion.jsx';

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  const token = useAuthStore((s) => s.token);
  const clearToken = useAuthStore((s) => s.clearToken);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return navigate('/login');
    loadProjects();
  }, [token, navigate]);

  async function loadProjects() {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const proj = await createProject({ name: newTitle, description: newDesc });
      toast.success('Project created');
      navigate(`/projects/${proj._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    }
  }

  // Greeting logic
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <PageTransition className="dashboard-page">
      <div className="dashboard-bg" />
      
      <nav className="navbar navbar-glass">
        <Logo />
        <div className="navbar-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} /> New Project
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => clearToken()}>
            Logout
          </button>
        </div>
      </nav>

      <main className="page-container">
        <div className="dashboard-header">
          <div>
            <h1>{greeting}</h1>
            <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Here is an overview of your projects and critical paths.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="surface" style={{ padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div className="text-tertiary" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Active Projects</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{projects.filter(p => p.status === 'active').length}</div>
            </div>
            <div className="surface" style={{ padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div className="text-tertiary" style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Total Projects</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{projects.length}</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" /> <span>Loading projects...</span>
          </div>
        ) : projects.length > 0 ? (
          <StaggerList className="projects-grid">
            {projects.map((p, i) => (
              <ProjectCard key={p._id} project={p} index={i} />
            ))}
          </StaggerList>
        ) : (
          <div className="surface empty-state" style={{ padding: '5rem 2rem' }}>
            <FolderKanban size={48} className="text-accent" style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
            <h2>No projects yet</h2>
            <p>Create your first project to start mapping your critical paths.</p>
            <button className="btn btn-hero" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Create Project
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div className="icon-btn" style={{ background: 'var(--accent-muted)', color: 'var(--accent-hover)' }}><Layout size={20} /></div>
              <h2 style={{ margin: 0 }}>New Project</h2>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Q3 Website Redesign"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief overview of the project goals..."
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!newTitle.trim()}>
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
