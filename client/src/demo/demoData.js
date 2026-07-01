/** Demo mode flag — persisted so recruiters can refresh the page. */
const DEMO_KEY = 'flowforge_demo_mode';

export function isDemoSession() {
  return sessionStorage.getItem(DEMO_KEY) === 'true';
}

export function enableDemoSession() {
  sessionStorage.setItem(DEMO_KEY, 'true');
}

export function disableDemoSession() {
  sessionStorage.removeItem(DEMO_KEY);
}

export const DEMO_USER = {
  id: 'demo-user',
  _id: 'demo-user',
  name: 'Demo Recruiter',
  email: 'demo@flowforge.dev',
};

export const DEMO_PROJECT_ID = 'demo-project';

export const DEMO_PROJECT = {
  _id: DEMO_PROJECT_ID,
  name: 'FlowForge Launch 🚀',
  description: 'Live demo — explore CPM, AI advisor, and ghost critical path',
  status: 'active',
  projectDuration: 28,
  deadline: new Date(Date.now() + 45 * 86400000).toISOString(),
  owner: DEMO_USER,
  members: [DEMO_USER],
  criticalPath: [],
};

export const DEMO_TASKS = [
  { _id: 't1', title: 'Research & Requirements', duration: 3, dependencies: [], est: 0, eft: 3, lst: 0, lft: 3, float: 0, isCritical: true, dps: 12, status: 'done', assignee: DEMO_USER },
  { _id: 't2', title: 'System Architecture', duration: 4, dependencies: ['t1'], est: 3, eft: 7, lst: 3, lft: 7, float: 0, isCritical: true, dps: 8, status: 'done', assignee: DEMO_USER },
  { _id: 't3', title: 'UI/UX Design', duration: 5, dependencies: ['t1'], est: 3, eft: 8, lst: 5, lft: 10, float: 2, isCritical: false, dps: 45, status: 'active', assignee: DEMO_USER },
  { _id: 't4', title: 'Backend API', duration: 6, dependencies: ['t2'], est: 7, eft: 13, lst: 7, lft: 13, float: 0, isCritical: true, dps: 15, status: 'active', assignee: DEMO_USER },
  { _id: 't5', title: 'CPM Algorithm Engine', duration: 5, dependencies: ['t2'], est: 7, eft: 12, lst: 8, lft: 13, float: 1, isCritical: false, dps: 38, status: 'active', assignee: DEMO_USER },
  { _id: 't6', title: 'Frontend Dashboard', duration: 4, dependencies: ['t3', 't4'], est: 13, eft: 17, lst: 14, lft: 18, float: 1, isCritical: false, dps: 42, status: 'pending', assignee: DEMO_USER },
  { _id: 't7', title: 'Graph Visualization', duration: 3, dependencies: ['t3', 't5'], est: 13, eft: 16, lst: 15, lft: 18, float: 2, isCritical: false, dps: 55, status: 'pending', assignee: DEMO_USER },
  { _id: 't8', title: 'AI Integration (LangChain)', duration: 4, dependencies: ['t4', 't5'], est: 13, eft: 17, lst: 13, lft: 17, float: 0, isCritical: true, dps: 22, status: 'pending', assignee: DEMO_USER },
  { _id: 't9', title: 'WebSocket Real-time', duration: 2, dependencies: ['t4'], est: 13, eft: 15, lst: 16, lft: 18, float: 3, isCritical: false, dps: 68, status: 'pending', assignee: DEMO_USER },
  { _id: 't10', title: 'Integration Testing', duration: 3, dependencies: ['t6', 't7', 't8', 't9'], est: 17, eft: 20, lst: 17, lft: 20, float: 0, isCritical: true, dps: 18, status: 'pending', assignee: DEMO_USER },
  { _id: 't11', title: 'Deploy to Production', duration: 2, dependencies: ['t10'], est: 20, eft: 22, lst: 20, lft: 22, float: 0, isCritical: true, dps: 10, status: 'pending', assignee: DEMO_USER },
];

DEMO_PROJECT.criticalPath = DEMO_TASKS.filter((t) => t.isCritical).map((t) => t._id);

export const DEMO_AI_ADVISOR = {
  analysis: `## 📊 FlowForge Launch — Graph Intelligence

**28 day** project with **6** critical tasks on the main chain.

### ⚡ Top Actions
1. Watch **UI/UX Design** — 62% chance of joining critical path via velocity drift
2. **AI Integration** has 22/100 DPS — assign buffer or parallelize WebSocket work
3. Frontend + Graph viz can run in parallel after Backend API completes — save 4 days

### 💡 Unique Insight
Ghost Critical Path detected: **CPM Algorithm Engine** may silently shift onto the critical chain if the assignee runs 20% over estimate — the deadline holds today but float is down to 1 day.`,
  health: { healthScore: 78, totalSmells: 2, redundantEdges: [], godTasks: [], longChains: [{ length: 6, chainDuration: 22 }], orphanedTasks: [] },
  ghostCriticalPath: {
    ghostTasks: [
      { taskId: 't3', title: 'UI/UX Design', probability: 62, reason: 'Velocity drift may consume 2d float', currentFloat: 2, projectedFloat: 0.5 },
      { taskId: 't5', title: 'CPM Algorithm Engine', probability: 48, reason: 'Parallel branch with only 1d slack after drift', currentFloat: 1, projectedFloat: 0 },
    ],
    shiftRisk: 55,
  },
  delayProphet: [
    { taskId: 't8', title: 'AI Integration (LangChain)', slipProbability: 72, urgency: 'imminent' },
    { taskId: 't4', title: 'Backend API', slipProbability: 58, urgency: 'likely' },
    { taskId: 't10', title: 'Integration Testing', slipProbability: 45, urgency: 'watch' },
  ],
  aiEnabled: true,
};

export const DEMO_GHOST_PATH = {
  ...DEMO_AI_ADVISOR.ghostCriticalPath,
  narrative: '⚠️ 2 tasks may silently join the critical path. Highest risk: "UI/UX Design" at 62% — velocity drift is consuming float before the team notices.',
  aiEnabled: true,
};

export const DEMO_STANDUP = {
  brief: `**Yesterday:** Completed Research & Requirements and System Architecture ✅

**Today:** Active work on UI/UX Design and Backend API. CPM engine implementation starting.

**Blockers:** None currently 🟢

**Risk:** AI Integration sits on the critical path with low float — any delay on Backend API or CPM Engine cascades to deployment.`,
  aiEnabled: true,
};

export const DEMO_SMART_DEPS = {
  suggestions: [
    { fromTaskId: 't4', fromTitle: 'Backend API', toTaskId: 't9', toTitle: 'WebSocket Real-time', confidence: 85, reason: 'WebSocket layer requires Backend API endpoints first' },
    { fromTaskId: 't5', fromTitle: 'CPM Algorithm Engine', toTaskId: 't8', toTitle: 'AI Integration (LangChain)', confidence: 78, reason: 'AI features consume CPM graph output' },
  ],
  aiEnabled: true,
  method: 'langchain+rules',
};

export const DEMO_DEADLINE = {
  optimisticDuration: 28,
  realisticDuration: 33,
  optimisticDeadline: new Date(Date.now() + 28 * 86400000),
  realisticDeadline: new Date(Date.now() + 33 * 86400000),
  assigneeDrifts: [{ userId: 'demo-user', name: 'Demo Recruiter', drift: 1.15 }],
};
