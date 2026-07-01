import { useAuthStore } from '../store/useAuthStore.js';
import { useDemoStore } from '../store/useDemoStore.js';
import {
  DEMO_USER,
  DEMO_PROJECT,
  DEMO_TASKS,
  DEMO_PROJECT_ID,
  DEMO_AI_ADVISOR,
  DEMO_GHOST_PATH,
  DEMO_STANDUP,
  DEMO_SMART_DEPS,
  DEMO_DEADLINE,
} from '../demo/demoData.js';

export function isInDemoMode() {
  return useDemoStore.getState().isDemoMode;
}

/** Activate demo mode and set auth state so UI renders as logged-in. */
export function activateRecruiterDemo() {
  useDemoStore.getState().enterDemo();
  useAuthStore.getState().setUser(DEMO_USER);
  useAuthStore.getState().setAccessToken('demo-token');
  useAuthStore.getState().setLoading(false);
}

export function getDemoProjects() {
  return [{ ...DEMO_PROJECT, members: [DEMO_USER] }];
}

export function getDemoProject() {
  return { ...DEMO_PROJECT, members: [DEMO_USER], criticalPath: DEMO_TASKS.filter((t) => t.isCritical) };
}

export function getDemoTasks() {
  return DEMO_TASKS.map((t) => ({ ...t, assignee: DEMO_USER }));
}

export async function demoDelay(ms = 400) {
  await new Promise((r) => setTimeout(r, ms));
}

export const demoApi = {
  getProjects: async () => { await demoDelay(); return getDemoProjects(); },
  getProject: async () => { await demoDelay(200); return getDemoProject(); },
  getTasks: async () => { await demoDelay(200); return getDemoTasks(); },
  getAIAdvisor: async () => { await demoDelay(600); return DEMO_AI_ADVISOR; },
  getGhostPath: async () => { await demoDelay(500); return DEMO_GHOST_PATH; },
  getStandup: async () => { await demoDelay(400); return DEMO_STANDUP; },
  getSmartDeps: async () => { await demoDelay(400); return DEMO_SMART_DEPS; },
  getDeadline: async () => { await demoDelay(200); return DEMO_DEADLINE; },
  getHealth: async () => { await demoDelay(300); return DEMO_AI_ADVISOR.health; },
  getOpportunities: async () => ({
    opportunities: [
      { tasks: [DEMO_TASKS[6], DEMO_TASKS[8]], timeSaved: 2, timeWindow: { start: 13, end: 16 } },
      { tasks: [DEMO_TASKS[2], DEMO_TASKS[4]], timeSaved: 3, timeWindow: { start: 3, end: 8 } },
    ],
  }),
  getHandoffReport: async () => ({
    totalLagDays: '0.5', avgLagHours: '2.1', worstHandoffs: [], handoffCount: 1,
  }),
};

export { DEMO_PROJECT_ID };
