# ============================================================
# PHASE 3 — ADVANCED FEATURES + DEPLOYMENT
# ============================================================
# WHEN TO USE: Phase 2 is complete and working.
# These features separate a good project from an exceptional one.
# Build them one at a time. Commit after each.
# ============================================================

# ---- FEATURE 3A: DEPENDENCY SMELL DETECTOR ----
# git commit -m "feat: dependency smell detector for graph health"

------- PASTE INTO CURSOR AGENT FOR FEATURE 3A -------

Build the Dependency Smell Detector. This is a background analysis that scans
the project's dependency graph for structural problems.

## Backend: Smell Detection Algorithm
Create `server/src/algorithms/smellDetector.js`:

Function `detectDependencySmells(tasks)`:
Returns an object with detected issues:

### Smell 1: Redundant Edges
An edge A→C is redundant if there's already a path A→B→C.
A→C adds no value because C already had to wait for A (via B→C's predecessor chain).
```javascript
function findRedundantEdges(tasks, adjList, taskMap) {
  // For each edge (from, to):
  //   Temporarily remove this edge
  //   Check if 'to' is still reachable from 'from' via other paths (DFS)
  //   If yes: this edge is redundant
  // Returns: [{ from: taskId, to: taskId, reason: "Already implied by path via Task X" }]
}
```

### Smell 2: God Tasks
A task that has more than 5 direct dependents (high out-degree in dependency graph).
If this task is delayed or blocked, it affects too many things.
```javascript
function findGodTasks(tasks, adjList) {
  // Count how many tasks directly depend on each task
  // If count >= 5: flag as god task
  // Returns: [{ taskId, title, dependentCount, risk: "HIGH" }]
}
```

### Smell 3: Long Sequential Chains
A chain of 6+ tasks with no branching (each task has exactly one predecessor and one successor).
These chains are risky — any single delay cascades through all of them.
```javascript
function findLongChains(tasks, adjList, inDegree) {
  // Find chains of length >= 6 with no branching
  // Returns: [{ chainTaskIds: [], length: 7, chainDuration: 14 }]
}
```

### Smell 4: Orphaned Tasks
Tasks that have no dependencies AND nothing depends on them — completely disconnected.
They probably aren't connected to the right place in the graph.
```javascript
function findOrphanedTasks(tasks, adjList, inDegree) {
  // Tasks where inDegree === 0 AND adjList[id].length === 0
  // Exclude tasks that are intentionally standalone (check if projectId has only 1 task)
  // Returns: [{ taskId, title }]
}
```

Master function:
```javascript
export function detectDependencySmells(tasks) {
  const { adjList, inDegree, taskMap } = buildGraph(tasks)
  return {
    redundantEdges: findRedundantEdges(tasks, adjList, taskMap),
    godTasks: findGodTasks(tasks, adjList),
    longChains: findLongChains(tasks, adjList, inDegree),
    orphanedTasks: findOrphanedTasks(tasks, adjList, inDegree),
    totalSmells: redundantEdges.length + godTasks.length + longChains.length + orphanedTasks.length,
    healthScore: calculateHealthScore(tasks.length, totalSmells)
    // healthScore: 100 - (smells * 10), min 0, max 100
  }
}
```

## Backend: API Endpoint
Add to project routes:
GET /api/projects/:projectId/health

- Fetch all tasks
- Call detectDependencySmells(tasks)
- Cache result in Redis for 5 minutes (key: `health:${projectId}`)
- Invalidate cache whenever graph changes (call redis.del(`health:${projectId}`) in recalculateAfterChange)
- Return the smell report

## Frontend: Graph Health Panel
Create `client/src/components/GraphHealthPanel.jsx`:

Triggered by a "Graph Health" button in the project header.
Opens as a side panel or modal.

```
GRAPH HEALTH REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Health Score: 72/100  ⚠️ Issues found

REDUNDANT EDGES (2 found)
  ⚠️ "Design" → "Deploy" is already implied by Design → Code → Deploy
     Suggestion: Remove this direct connection

GOD TASKS (1 found)
  🔴 "Backend API Setup" has 8 direct dependents
     Risk: This is a single point of failure. Consider breaking it into smaller tasks.

ORPHANED TASKS (1 found)
  ⚪ "Write marketing copy" has no connections
     Suggestion: Connect it to its predecessor and successor tasks

LONG CHAINS (1 found)
  ⚠️ Chain of 7 sequential tasks (24 days total)
     Risk: Any delay cascades through all 7. Add parallel tracks if possible.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[HIGHLIGHT IN GRAPH]
```

"Highlight in Graph" button:
- For redundant edges: highlight those edges in yellow on the graph
- For god tasks: highlight that node in red with a warning icon
- For orphans: highlight in gray

------- END OF FEATURE 3A PROMPT -------


# ---- FEATURE 3B: PARALLEL OPPORTUNITY FINDER ----
# git commit -m "feat: parallel opportunity finder"

------- PASTE INTO CURSOR AGENT FOR FEATURE 3B -------

Build the Parallel Opportunity Finder. After topological sort, identify groups of tasks
that have no dependency relationship between them and could run simultaneously.

## Backend: Parallel Analysis Algorithm
Add to `server/src/algorithms/parallelFinder.js`:

Function `findParallelOpportunities(tasks)`:
```javascript
// After running CPM, find tasks that:
// 1. Have no direct or indirect dependency relationship between them
//    (A and B are independent if A is not reachable from B and B is not reachable from A)
// 2. Have overlapping time windows (their EST-EFT ranges overlap)
// 3. Have different assignees (or unassigned)

// Algorithm:
// Step 1: Build reachability matrix using DFS for each pair (expensive but correct)
//         Alternative: For n tasks, n*(n-1)/2 pairs to check
// Step 2: For each independent pair with overlapping time windows:
//         Calculate potential time savings if run in parallel
// Step 3: Group overlapping opportunities into "parallel sets"
//         (Tasks A, B, C can all run at the same time)

// Returns:
[
  {
    tasks: [taskA, taskB, taskC],      // tasks that can run in parallel
    timeSaved: 6,                       // days saved vs running sequentially
    timeWindow: { start: 3, end: 8 },  // when this parallel window is
    assigneesNeeded: [userId1, userId2, userId3],
    isCurrentlyParallel: false          // are they already being run in parallel?
  }
]
```

API endpoint:
GET /api/projects/:projectId/opportunities

## Frontend: Opportunities Panel
Create `client/src/components/OpportunitiesPanel.jsx`:

Accessible from a "Find Parallel Opportunities" button.

```
PARALLEL OPPORTUNITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 3 opportunities found — save up to 11 days

OPPORTUNITY 1 — Days 3 to 8
  ┌─────────────────────────┐
  │ Write API docs          │ (Alex)
  │ Create test data        │ (Priya)
  │ Set up CI pipeline      │ (Saikat)
  └─────────────────────────┘
  These 3 tasks can all run simultaneously
  Sequential time: 9 days | Parallel time: 3 days
  ⚡ Saves 6 days

OPPORTUNITY 2 — Days 11 to 13
  ┌─────────────────────────┐
  │ Write unit tests        │ (Saikat)
  │ Design error pages      │ (Alex)
  └─────────────────────────┘
  ⚡ Saves 5 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total potential savings: 11 days
[HIGHLIGHT IN GRAPH]
```

------- END OF FEATURE 3B PROMPT -------


# ---- FEATURE 3C: HANDOFF LAG TRACKER ----
# git commit -m "feat: handoff lag tracker"

------- PASTE INTO CURSOR AGENT FOR FEATURE 3C -------

Build the Handoff Lag Tracker. Measure invisible time lost between tasks completing
and the next task starting.

## Backend: Lag Tracking
Update taskController.js in updateTaskStatus:
When status changes to 'active':
```javascript
// Find all predecessor tasks (tasks this one depends on)
// Check which ones are already 'done' and have an actualEnd timestamp
// handoffLag = now - max(actualEnd of done predecessors)
// Store in task.handoffLag (in minutes)
const predecessorIds = task.dependencies
const donePredecessors = await Task.find({ _id: { $in: predecessorIds }, status: 'done' })
if (donePredecessors.length > 0) {
  const latestPredEnd = Math.max(...donePredecessors.map(p => p.actualEnd?.getTime() || 0))
  task.handoffLag = (Date.now() - latestPredEnd) / (1000 * 60)  // in minutes
}
```

Create `server/src/services/handoffService.js`:

Function `getHandoffReport(projectId)`:
```javascript
// Fetch all tasks with handoffLag > 0
// Calculate:
// - totalLagHours: sum of all handoffLag values (convert minutes to hours)
// - totalLagDays: totalLagHours / 8 (8-hour workday)
// - avgLagHours: average per handoff
// - worstHandoffs: top 3 handoffs by lag duration
// - lateHandoffs: handoffs > 4 hours (half a workday)
// Return the report
```

API: GET /api/projects/:projectId/handoff-report

## Frontend: Handoff Lag Dashboard Widget
Create `client/src/components/HandoffLagWidget.jsx`:
```
HANDOFF LAG REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━
Total invisible time lost: 2.4 days
Average lag per handoff:   3.2 hours

WORST HANDOFFS:
  "Build Auth" → "Write Tests"      14.5 hours  😬
  "Design UI"  → "Build Frontend"    8.2 hours  ⚠️
  "Test API"   → "Deploy Staging"    2.1 hours  ✓

Tip: 14.5 hour lag on tests suggests
     the developer wasn't notified promptly.
━━━━━━━━━━━━━━━━━━━━━━━━━━
```

------- END OF FEATURE 3C PROMPT -------


# ---- FINAL STEP: DEPLOYMENT ----
# git commit -m "chore: production deployment configuration"

------- PASTE INTO CURSOR AGENT FOR DEPLOYMENT -------

Prepare FlowForge for production deployment. I am deploying to:
- Backend API: Render (free tier)
- Frontend: Vercel
- Database: MongoDB Atlas (free tier)
- Redis: Upstash Redis (free tier, serverless)

## Step 1: Environment Configuration
Create proper `.env.example` files for both server and client with every required variable.
Make sure `.env` files are in `.gitignore` and NEVER committed.

## Step 2: Production Server Configuration
In `server/src/server.js`:
- Add trust proxy: `app.set('trust proxy', 1)` — needed for Render's proxy
- Ensure CORS origin reads from environment variable, not hardcoded
- Add a GET /api/health endpoint that returns { status: 'ok', timestamp: new Date() }
  — Render uses this for health checks

In `server/package.json`:
- "start" script: "node src/server.js"  (not nodemon)
- "dev" script: "nodemon src/server.js"

## Step 3: Client Build Configuration
In `client/vite.config.js`:
- Ensure build output goes to `dist/` folder
- Set base URL for production

In `client/package.json`:
- "build" script: "vite build"
- "preview" script: "vite preview"

## Step 4: MongoDB Atlas Setup Instructions
Write a section in README.md:
1. Create free MongoDB Atlas account at atlas.mongodb.com
2. Create a free M0 cluster
3. Create database user with read/write permissions
4. Add 0.0.0.0/0 to IP allowlist (allows Render to connect)
5. Copy connection string → set as MONGODB_URI in Render env vars

## Step 5: Upstash Redis Setup Instructions
Write instructions for:
1. Create free Upstash account at upstash.com
2. Create a Redis database (free tier: 10,000 commands/day)
3. Copy the Redis URL → set as REDIS_URL in Render env vars

## Step 6: Render Deployment Instructions
Write a render.yaml file for the server:
```yaml
services:
  - type: web
    name: flowforge-api
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: MONGODB_URI
        sync: false  # set manually in Render dashboard
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: REDIS_URL
        sync: false
      - key: CLIENT_URL
        sync: false
```

## Step 7: Vercel Deployment
Create `vercel.json` in the client folder:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```
This makes React Router work on Vercel (all routes serve index.html).

## Step 8: Professional README
Update the root README.md with:

```markdown
# FlowForge — Real-Time Critical Path Orchestration Engine

> "It tells you exactly which tasks will kill your deadline — before they do."

**Live Demo:** [your-url.vercel.app](https://your-url.vercel.app)
**API:** [your-api.onrender.com/api/health](https://your-api.onrender.com/api/health)

## What It Solves
[2-paragraph explanation of the problem and solution]

## Tech Stack
- **Frontend:** React 18, React Flow, Zustand, Socket.io-client
- **Backend:** Node.js, Express.js, Socket.io, Bull, Redis
- **Database:** MongoDB with Mongoose
- **Auth:** JWT + Refresh Token Rotation
- **Deployment:** Render + Vercel + MongoDB Atlas + Upstash Redis

## Core Algorithms (Implemented from Scratch)
- Topological Sort (Kahn's Algorithm)
- DFS Cycle Detection (Gray/White/Black coloring)
- CPM Forward Pass (EST/EFT computation)
- CPM Backward Pass (LST/LFT/Float computation)
- Cascade Impact BFS (Blast Radius propagation)

## Unique Features
1. Blast Radius — shows deadline impact when a task is blocked
2. What-If Sandbox — simulate project changes without affecting real data
3. Velocity Drift Detection — realistic deadlines based on team history
4. Deadline Pressure Score — predicts which tasks are about to become critical
5. Dependency Smell Detector — flags structural problems in the task graph
6. Parallel Opportunity Finder — suggests tasks that can run simultaneously
7. Handoff Lag Tracker — measures invisible time lost between tasks

## Running Locally
[step by step instructions]

## Architecture Diagram
[ASCII diagram of the system]
```

## Step 9: Final Pre-Deploy Checklist
Add these checks to README:
- [ ] All .env files in .gitignore
- [ ] No hardcoded URLs (all from env vars)
- [ ] CORS configured for production URL
- [ ] Rate limiting enabled
- [ ] Error messages don't expose stack traces in production
- [ ] All API routes return consistent { success, data/error } format
- [ ] MongoDB Atlas connection string uses a database user (not root)
- [ ] JWT secrets are long random strings (not "secret123")

------- END OF DEPLOYMENT PROMPT -------
