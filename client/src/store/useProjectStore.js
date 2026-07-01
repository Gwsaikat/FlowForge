import { create } from 'zustand';

export const useProjectStore = create((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  addProject: (project) => set((s) => ({ projects: [project, ...s.projects] })),
  setLoading: (isLoading) => set({ isLoading }),
}));
