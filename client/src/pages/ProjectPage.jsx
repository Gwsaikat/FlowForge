import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Command } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProjectStore } from '../store/useProjectStore.js';
import { useGraphStore } from '../store/useGraphStore.js';
import { useProjectSocket } from '../hooks/useProjectSocket.js';
import { PageTransition } from '../components/ui/Motion.jsx';
import GraphCanvas from '../components/GraphCanvas.jsx';
import TaskListItem from '../components/TaskListItem.jsx';
import AddTaskModal from '../components/AddTaskModal.jsx';
import TaskDetailDrawer from '../components/TaskDetailDrawer.jsx';
import DeadlineWidget from '../components/DeadlineWidget.jsx';
import VelocityPanel from '../components/VelocityPanel.jsx';
import GraphHealthPanel from '../components/GraphHealthPanel.jsx';
import OpportunitiesPanel from '../components/OpportunitiesPanel.jsx';
import HandoffLagWidget from '../components/HandoffLagWidget.jsx';
import SandboxPanel from '../components/SandboxPanel.jsx';
import PulseTimeline from '../components/PulseTimeline.jsx';
import CommandPalette, { useCommandPalette } from '../components/CommandPalette.jsx';
import AIAdvisorPanel from '../components/ai/AIAdvisorPanel.jsx';
import GhostPathPanel from '../components/ai/GhostPathPanel.jsx';
import SmartDepsPanel from '../components/ai/SmartDepsPanel.jsx';
import StandupPanel from '../components/ai/StandupPanel.jsx';
import { tasksToGraph } from '../utils/graphLayout.js';

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { setCurrentProject } = useProjectStore();
  const { tasks, loadProjectData, isRecalculating } = useGraphStore();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panels, setPanels] = useState({ health: false, opportunities: false, sandbox: false, advisor: false, ghost: false, smartDeps: false, standup: false });
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  useProjectSocket(projectId);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const { project: p } = await loadProjectData(projectId);
      setProject(p);
      setCurrentProject(p);
    } catch {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [projectId]);

  function togglePanel(name) {
    setPanels((p) => ({ ...p, [name]: !p[name] }));
  }

  function handleCmdAction(action, payload) {
    const map = {
      'add-task': () => setShowAddTask(true),
      'ai-advisor': () => togglePanel('advisor'),
      'ghost-path': () => togglePanel('ghost'),
      'smart-deps': () => togglePanel('smartDeps'),
      'standup': () => togglePanel('standup'),
      'sandbox': () => togglePanel('sandbox'),
      'health': () => togglePanel('health'),
      'open-task': () => { setSelectedTask(payload); setDrawerOpen(true); },
    };
    map[action]?.();
  }

  function highlightGhostNodes(nodeIds) {
    const { nodes, edges } = tasksToGraph(tasks, [], nodeIds);
    useGraphStore.setState({ nodes, edges });
  }

  if (loading) {
    return (
      <div className="loading-center loading-full">
        <motion.div className="spinner" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
        <span>Loading graph intelligence...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state loading-full">
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadData}>Retry</button>
      </div>
    );
  }

  const members = project?.members || [];

  return (
    <PageTransition className="project-page">
      <nav className="navbar navbar-glass">
        <motion.span className="navbar-brand" whileHover={{ x: -4 }} onClick={() => navigate('/dashboard')}>
          ← {project?.name}
        </motion.span>
        <div className="navbar-actions">
          <button className="btn btn-ai" onClick={() => togglePanel('advisor')}>
            <Sparkles size={16} /> AI Advisor
          </button>
          <button className="btn btn-ghost-sm" onClick={() => setCmdOpen(true)}>
            <Command size={14} /> ⌘K
          </button>
        </div>
      </nav>

      {panels.sandbox && (
        <div className="sandbox-banner">🧪 SANDBOX MODE — Changes don&apos;t affect real data until applied</div>
      )}

      <div className="project-toolbar">
        <DeadlineWidget projectId={projectId} />
        <PulseTimeline tasks={tasks} />
      </div>

      <div className="header-actions toolbar-btns">
        {[
          ['ghost', '👻 Ghost Path'],
          ['smartDeps', '🧠 Smart Deps'],
          ['standup', '🎙 Standup'],
          ['health', '❤️ Health'],
          ['opportunities', '⚡ Parallel'],
          ['sandbox', '🧪 Sandbox'],
        ].map(([key, label]) => (
          <motion.button
            key={key}
            className={`btn btn-chip ${panels[key] ? 'active' : ''}`}
            onClick={() => togglePanel(key)}
            whileTap={{ scale: 0.95 }}
          >
            {label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {panels.advisor && <AIAdvisorPanel projectId={projectId} onClose={() => togglePanel('advisor')} />}
        {panels.ghost && <GhostPathPanel projectId={projectId} onClose={() => togglePanel('ghost')} onHighlight={highlightGhostNodes} />}
        {panels.smartDeps && <SmartDepsPanel projectId={projectId} onClose={() => togglePanel('smartDeps')} onApplied={loadData} />}
        {panels.standup && <StandupPanel projectId={projectId} onClose={() => togglePanel('standup')} />}
      </AnimatePresence>

      {panels.health && <div className="panel-wrap"><GraphHealthPanel projectId={projectId} onClose={() => togglePanel('health')} /></div>}
      {panels.opportunities && <div className="panel-wrap"><OpportunitiesPanel projectId={projectId} onClose={() => togglePanel('opportunities')} /></div>}
      {panels.sandbox && <div className="panel-wrap"><SandboxPanel projectId={projectId} tasks={tasks} onClose={() => togglePanel('sandbox')} /></div>}

      <div className="project-layout">
        <aside className="project-sidebar">
          <motion.button className="btn btn-primary btn-full" onClick={() => setShowAddTask(true)} whileHover={{ scale: 1.02 }}>
            + Add Task
          </motion.button>
          {isRecalculating && <div className="recalc-indicator"><div className="spinner" /> Recalculating CPM...</div>}
          <div className="task-list">
            {tasks.length === 0 ? (
              <div className="empty-state"><p>No tasks yet</p></div>
            ) : (
              tasks.map((task, i) => (
                <motion.div key={task._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <TaskListItem task={task} onClick={(t) => { setSelectedTask(t); setDrawerOpen(true); }} />
                </motion.div>
              ))
            )}
          </div>
          <VelocityPanel projectId={projectId} />
          <HandoffLagWidget projectId={projectId} />
        </aside>
        <main className="project-graph">
          <GraphCanvas onTaskClick={(t) => { setSelectedTask(t); setDrawerOpen(true); }} sandboxMode={panels.sandbox} />
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onAction={handleCmdAction} tasks={tasks} />

      {showAddTask && (
        <AddTaskModal projectId={projectId} tasks={tasks} members={members} onClose={() => setShowAddTask(false)} onCreated={() => loadData()} />
      )}

      <TaskDetailDrawer
        task={selectedTask}
        projectId={projectId}
        tasks={tasks}
        members={members}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdated={loadData}
      />
    </PageTransition>
  );
}
