import { create } from 'zustand';
import api from '../services/api.js';
import { tasksToGraph } from '../utils/graphLayout.js';
import { isInDemoMode, demoApi } from '../demo/demoApi.js';

export const useGraphStore = create((set, get) => ({
  tasks: [],
  nodes: [],
  edges: [],
  criticalPath: [],
  isRecalculating: false,
  highlights: { edges: [], nodes: [] },

  setTasks: (tasks) => set((s) => {
    const { nodes, edges } = tasksToGraph(tasks, s.highlights.edges, s.highlights.nodes);
    return {
      tasks,
      nodes,
      edges,
      criticalPath: tasks.filter((t) => t.isCritical).map((t) => t._id),
    };
  }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setCriticalPath: (criticalPath) => set({ criticalPath }),
  setHighlights: (highlights) => set((s) => {
    const { nodes, edges } = tasksToGraph(s.tasks, highlights.edges || [], highlights.nodes || []);
    return { highlights, nodes, edges };
  }),

  updateTask: (task) =>
    set((s) => {
      const tasks = s.tasks.map((t) => (t._id === task._id ? task : t));
      const { nodes, edges } = tasksToGraph(tasks, s.highlights.edges, s.highlights.nodes);
      return { tasks, nodes, edges };
    }),

  setRecalculating: (isRecalculating) => set({ isRecalculating }),

  loadProjectData: async (projectId) => {
    set({ isRecalculating: true });
    try {
      if (isInDemoMode()) {
        const [project, tasks] = await Promise.all([
          demoApi.getProject(),
          demoApi.getTasks(),
        ]);
        const { nodes, edges } = tasksToGraph(tasks);
        set({
          tasks,
          nodes,
          edges,
          criticalPath: tasks.filter((t) => t.isCritical).map((t) => t._id),
          isRecalculating: false,
        });
        return { project, tasks };
      }

      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
      ]);
      const project = projectRes.data.data.project;
      const tasks = tasksRes.data.data.tasks;
      const { nodes, edges } = tasksToGraph(tasks);
      set({
        tasks,
        nodes,
        edges,
        criticalPath: tasks.filter((t) => t.isCritical).map((t) => t._id),
        isRecalculating: false,
      });
      return { project, tasks };
    } catch (err) {
      set({ isRecalculating: false });
      throw err;
    }
  },
}));
