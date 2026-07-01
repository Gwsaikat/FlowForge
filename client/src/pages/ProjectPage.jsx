import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Settings, BrainCircuit, Play, ArrowLeft,
  Ghost, Lightbulb, LayoutPanelLeft, Bot, Search, X
} from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore.js';
import { useDemoStore } from '../store/useDemoStore.js';
import { getProject } from '../services/projectService.js';
import { activateRecruiterDemo, isInDemoMode } from '../demo/demoApi.js';

import GraphCanvas from '../components/GraphCanvas.jsx';
import TaskDetailDrawer from '../components/TaskDetailDrawer.jsx';
import AddTaskModal from '../components/AddTaskModal.jsx';
import SandboxPanel from '../components/SandboxPanel.jsx';
import GraphHealthPanel from '../components/GraphHealthPanel.jsx';
import AIAdvisorPanel from '../components/ai/AIAdvisorPanel.jsx';
import GhostPathPanel from '../components/ai/GhostPathPanel.jsx';
import SmartDepsPanel from '../components/ai/SmartDepsPanel.jsx';
import StandupPanel from '../components/ai/StandupPanel.jsx';
import CommandPalette from '../components/CommandPalette.jsx';
import DemoBanner from '../components/DemoBanner.jsx';
import DeadlineWidget from '../components/DeadlineWidget.jsx';
import Logo from '../components/ui/Logo.jsx';
import { PageTransition, SlideIn } from '../components/ui/Motion.jsx';

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const isDemoMode = useDemoStore((s) => s.isDemoMode);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI State
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  // Active Side Panel
  const [activePanel, setActivePanel] = useState(null);
  const [sandboxState, setSandboxState] = useState(null);

  // Mobile tabs
  const [mobileView, setMobileView] = useState('graph');
  const [showSidebar, setShowSidebar] = useState(true);

  const tasks = useGraphStore((s) => s.tasks);
  const nodes = useGraphStore((s) => s.nodes);
  const setTasks = useGraphStore((s) => s.setTasks);
  const loadProjectData = useGraphStore((s) => s.loadProjectData);

  const projectDuration = useMemo(() => {
    if (!tasks.length) return 0;
    return Math.max(...tasks.map((t) => t.eft || 0));
  }, [tasks]);

  useEffect(() => {
    loadProject();

    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [projectId]);

  async function loadProject() {
    setLoading(true);
    try {
      const result = await loadProjectData(projectId);
      setProject(result.project);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  function handleTaskUpdated(task) {
    if (task) {
      useGraphStore.getState().updateTask(task);
      setSelectedTask(task);
    } else {
      loadProject();
    }
  }

  function handleCommandAction(actionId, payload) {
    switch (actionId) {
      case 'add-task': setShowAddModal(true); break;
      case 'ai-advisor': setActivePanel('ai'); break;
      case 'ghost-path': setActivePanel('ghost'); break;
      case 'smart-deps': setActivePanel('smart-deps'); break;
      case 'standup': setActivePanel('standup'); break;
      case 'sandbox': setActivePanel('sandbox'); break;
      case 'health': setActivePanel('health'); break;
      case 'open-task': if (payload) setSelectedTask(payload); break;
      default: break;
    }
  }

  if (loading) return <div className="loading-full"><div className="spinner" /> <span>Loading workspace...</span></div>;
  if (!project) return null;

  return (
    <PageTransition className="project-page">
      {isDemoMode && <DemoBanner />}

      {/* Top Navbar */}
      <nav className="navbar navbar-premium">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="icon-btn" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>{project.name}</div>
            <div className="sidebar-meta" style={{ marginTop: 0 }}>
              {projectDuration} days · {tasks.length} tasks
            </div>
          </div>
        </div>

        <div className="navbar-actions">
          <button className="btn btn-ghost-sm" onClick={() => setCmdOpen(true)}>
            <Search size={14} style={{ display: 'inline', marginRight: 4 }} />
            Search <kbd style={{ marginLeft: 4, opacity: 0.5 }}>Ctrl+K</kbd>
          </button>

          <button className="btn btn-ai" onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}>
            <BrainCircuit size={14} /> AI Advisor
          </button>

          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

          <button className="icon-btn" title="Toggle Sidebar" onClick={() => setShowSidebar(!showSidebar)}>
            <LayoutPanelLeft size={18} />
          </button>
          <button className="icon-btn" onClick={() => setActivePanel('settings')} title="Settings">
            <Settings size={18} />
          </button>
        </div>
      </nav>

      {/* Action Toolbar */}
      <div className="project-toolbar">
        <div className="toolbar-scroll">
          <div className="toolbar-btns">
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> Add Task
            </button>
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

            <button className={`btn btn-chip ${activePanel === 'health' ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 'health' ? null : 'health')}>
              Health Score
            </button>
            <button className={`btn btn-chip ${activePanel === 'sandbox' ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 'sandbox' ? null : 'sandbox')}>
              <Play size={12} /> Sandbox Mode
            </button>

            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

            <button className={`btn btn-chip ${activePanel === 'ghost' ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 'ghost' ? null : 'ghost')}>
              <Ghost size={12} /> Ghost Paths
            </button>
            <button className={`btn btn-chip ${activePanel === 'smart-deps' ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 'smart-deps' ? null : 'smart-deps')}>
              <Lightbulb size={12} /> Smart Deps
            </button>
            <button className={`btn btn-chip ${activePanel === 'standup' ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 'standup' ? null : 'standup')}>
              <Bot size={12} /> Standup
            </button>
          </div>
        </div>

        <DeadlineWidget projectId={project._id} />
      </div>

      {/* Mobile Tabs */}
      <div className="mobile-view-tabs">
        <button className={mobileView === 'graph' ? 'active' : ''} onClick={() => setMobileView('graph')}>
          Graph View
        </button>
        <button className={mobileView === 'list' ? 'active' : ''} onClick={() => setMobileView('list')}>
          List & Panels
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className={`project-layout ${!showSidebar ? 'sidebar-hidden' : ''} ${mobileView === 'list' ? 'graph-hidden' : ''} ${mobileView === 'graph' ? 'sidebar-hidden-mobile' : ''}`}>

        {/* Left Sidebar */}
        <div className="project-sidebar">

          <AnimatePresence mode="wait">
            {activePanel === 'sandbox' && (
              <SlideIn direction="left" key="sandbox">
                <div className="panel-header-row">
                  <h3><Play size={16} className="text-accent" style={{ display: 'inline', marginRight: 6 }} /> Sandbox</h3>
                  <button className="icon-btn" onClick={() => { setActivePanel(null); useGraphStore.getState().setHighlights({ edges: [], nodes: [] }); }}><X size={16} /></button>
                </div>
                <SandboxPanel tasks={tasks} setSandboxState={setSandboxState} />
              </SlideIn>
            )}

            {activePanel === 'health' && (
              <SlideIn direction="left" key="health">
                <div className="panel-header-row">
                  <h3>Health Metrics</h3>
                  <button className="icon-btn" onClick={() => { setActivePanel(null); useGraphStore.getState().setHighlights({ edges: [], nodes: [] }); }}><X size={16} /></button>
                </div>
                <GraphHealthPanel tasks={tasks} />
              </SlideIn>
            )}

            {activePanel === 'ai' && <AIAdvisorPanel key="ai" projectId={project._id} onClose={() => { setActivePanel(null); useGraphStore.getState().setHighlights({ edges: [], nodes: [] }); }} />}
            {activePanel === 'ghost' && <GhostPathPanel key="ghost" projectId={project._id} onClose={() => { setActivePanel(null); useGraphStore.getState().setHighlights({ edges: [], nodes: [] }); }} onHighlight={(nodes) => useGraphStore.getState().setHighlights({ nodes, edges: [] })} />}
            {activePanel === 'smart-deps' && <SmartDepsPanel key="smart-deps" projectId={project._id} onClose={() => { setActivePanel(null); useGraphStore.getState().setHighlights({ edges: [], nodes: [] }); }} />}
            {activePanel === 'standup' && <StandupPanel key="standup" projectId={project._id} onClose={() => { setActivePanel(null); useGraphStore.getState().setHighlights({ edges: [], nodes: [] }); }} />}

            {/* Task List (Default view if no panel active) */}
            {!activePanel && (
              <motion.div key="tasklist" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="sidebar-header">
                  <h2>Tasks</h2>
                </div>
                {sandboxState && (
                  <div className="recalc-indicator">
                    <div className="spinner spinner-sm" /> Previewing sandbox impact
                  </div>
                )}
                <div className="task-list">
                  {tasks.map((t) => (
                    <div
                      key={t._id}
                      className={`task-list-item ${t.isCritical ? 'critical' : ''}`}
                      onClick={() => setSelectedTask(t)}
                    >
                      <div className="task-list-top">
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{t.title}</span>
                        {t.isCritical && <span style={{ fontSize: 10, background: 'var(--danger-muted)', color: '#FCA5A5', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>CRITICAL</span>}
                      </div>
                      <div className="task-list-meta">
                        {t.duration} days · {t.assignee?.name || 'Unassigned'}
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                      <p>No tasks found. Click "Add Task" to start building your graph.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Graph Canvas */}
        <div className="project-graph">
          <GraphCanvas onTaskClick={setSelectedTask} sandboxMode={!!sandboxState} />
        </div>
      </div>

      {/* Drawers and Modals */}
      <TaskDetailDrawer
        task={selectedTask}
        projectId={project._id}
        tasks={tasks}
        members={project.members || []}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={handleTaskUpdated}
      />

      {showAddModal && (
        <AddTaskModal
          projectId={project._id}
          tasks={tasks}
          members={project.members || []}
          onClose={() => setShowAddModal(false)}
          onCreated={() => loadProject()}
        />
      )}

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onAction={handleCommandAction}
        tasks={tasks}
      />
    </PageTransition>
  );
}
