# ============================================================
# PHASE 2 — REAL-TIME + PREDICTIVE INTELLIGENCE FEATURES
# ============================================================
# WHEN TO USE: After Phase 1 is deployed and working on live URL.
# EXPECTED RESULT: Live multi-user sync, Velocity Drift, DPS, Redis caching.
# TIME: ~3 days
# COMMIT AFTER EACH FEATURE individually.
# ============================================================

# ---- FEATURE 2A: VELOCITY DRIFT DETECTION ----
# git commit -m "feat: velocity drift detection and realistic deadline"

------- PASTE INTO CURSOR AGENT FOR FEATURE 2A -------

Build Velocity Drift Detection for FlowForge. This tracks the difference between
estimated task duration and actual duration per team member over time.

## Backend: Drift Calculation Service
Create `server/src/services/velocityService.js`:

Function `calculateDriftCoefficient(userId)`:
- Find the last 10 completed tasks assigned to this userId where actualEnd is not null
- For each task: actualDays = (actualEnd - actualStart) / (1000 * 60 * 60 * 24)
  and ratio = actualDays / estimatedDuration
- Calculate average of all ratios
- If fewer than 3 completed tasks: return 1.0 (not enough data yet)
- If average > 3.0: cap at 3.0 (sanity limit)
- If average < 0.3: cap at 0.3 (sanity limit)
- Return the coefficient (e.g., 1.4 means person is consistently 40% over estimate)

Function `updateUserDrift(userId)`:
- Call calculateDriftCoefficient(userId)
- Update User.velocityDrift in MongoDB
- Return the new drift value

Function `getRealisticProjectDuration(tasks)`:
- For each task, get the assignee's velocityDrift from the User document
- Adjusted duration = task.duration * assignee.velocityDrift
- Re-run CPM with adjusted durations
- Return { optimisticDuration: original CPM result, realisticDuration: drift-adjusted result }

## Backend: Trigger Drift Update
In taskController.js, in the updateTaskStatus function:
- When a task is marked 'done' AND actualStart exists:
  - Calculate actualDays from actualStart to now
  - Update task.actualEnd = now
  - Call updateUserDrift(task.assignee) in the background (don't await — use .catch to log errors)

## Backend: New API Endpoint
Add to task routes:
- GET /api/projects/:projectId/deadline → calls getRealisticProjectDuration
  Returns: { optimisticDeadline: date, realisticDeadline: date, assigneeDrifts: [{userId, name, drift}] }

## Frontend: Realistic Deadline Widget
Create `client/src/components/DeadlineWidget.jsx`:
Shows two deadline estimates side by side:
```
OPTIMISTIC DEADLINE        REALISTIC DEADLINE
Based on estimates         Adjusted for team velocity

Day 42 (Oct 15)            Day 51 (Oct 24)
                           ↑ +9 days based on history
```
- Green if realistic = optimistic (team is accurate)
- Orange if realistic is 10-20% longer
- Red if realistic is 20%+ longer
- Small tooltip: "Based on X completed tasks per team member"
- Show "Not enough data" if fewer than 3 completed tasks per person

Show this widget in the Project Page header area.

## Frontend: Team Velocity Panel
Create `client/src/components/VelocityPanel.jsx`:
A panel showing each team member's drift coefficient:
```
Team Velocity
──────────────────────────────
Saikat Roy      1.0x  ✅ On target
Alex Chen       1.4x  ⚠️ +40% over estimates
Priya Singh     0.8x  🚀 Finishing early
──────────────────────────────
Tip: Tasks assigned to Alex should add 40% buffer
```
- Fetch from GET /api/projects/:projectId/deadline
- Only show to project owner/admin

------- END OF FEATURE 2A PROMPT -------


# ---- FEATURE 2B: DEADLINE PRESSURE SCORE ----
# git commit -m "feat: deadline pressure score on all tasks"

------- PASTE INTO CURSOR AGENT FOR FEATURE 2B -------

Build the Deadline Pressure Score (DPS) feature for FlowForge.
DPS is a number from 0-100 showing how urgent a task is RIGHT NOW.
100 = no urgency. 0 = this task is about to destroy the deadline.

## Backend: DPS Calculation
Add to `server/src/services/graphService.js`:

Function `calculateDPS(task, project)`:
```javascript
// DPS formula (simplified):
// timeRemaining = project.deadline - today (in days)
// floatRatio = task.float / max(timeRemaining, 1)
// dependencyWeight = number of tasks that depend on this one (get from adjList)
// dependencyFactor = 1 + (dependencyWeight * 0.1)  // more dependents = more pressure
// rawDPS = floatRatio * 100 / dependencyFactor
// DPS = Math.max(0, Math.min(100, rawDPS))

// Special cases:
// If task.isCritical → DPS = 0 (maximum urgency)
// If task.status === 'done' → DPS = 100 (no pressure)
// If no project deadline set → DPS based on float alone
```

Function `updateAllDPS(projectId)`:
- Fetch project and all tasks
- Build adjList to know each task's successor count
- For each task, call calculateDPS()
- Bulk update dps field in MongoDB
- Called after every graph recalculation

Call updateAllDPS inside recalculateAfterChange() after CPM completes.

## Frontend: DPS Visual Indicator
In `TaskNode.jsx` (the graph node) and `TaskListItem.jsx`:
Add a DPS indicator:
- Small circular gauge or progress bar
- Color: green (DPS 60-100), orange (DPS 30-60), red (DPS 0-30)
- Hover tooltip: "Deadline Pressure: 23/100 — High urgency. Float running low."

Create `client/src/components/DPSBadge.jsx`:
```jsx
// Renders a small colored badge with the DPS number
// Props: dps (number)
// 0-30: red bg, "HIGH PRESSURE"
// 31-60: orange bg, "WATCH"
// 61-100: green bg, "OK"
```

In the Dashboard (project cards), show the average DPS of critical path tasks
as a project health indicator:
```
🔴 High Pressure  (avg DPS < 30)
🟡 Watch          (avg DPS 30-60)
🟢 On Track       (avg DPS > 60)
```

------- END OF FEATURE 2B PROMPT -------


# ---- FEATURE 2C: REDIS CACHING + RATE LIMITING ----
# git commit -m "feat: redis caching for CPM results and rate limiting"

------- PASTE INTO CURSOR AGENT FOR FEATURE 2C -------

Add Redis caching for CPM results and distributed rate limiting.

## CPM Result Caching
Update `server/src/services/graphService.js`:

In `recalculateGraph(projectId)`:
BEFORE running CPM:
```javascript
const cacheKey = `cpm:${projectId}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)  // return cached result instantly
```

AFTER running CPM and saving to DB:
```javascript
await redis.setex(cacheKey, 60, JSON.stringify(cpmResult))
// setex = set with expiry. 60 seconds cache TTL.
```

Cache invalidation — ALWAYS clear cache when graph changes:
```javascript
// Add this helper:
async function invalidateCPMCache(projectId) {
  await redis.del(`cpm:${projectId}`)
}
// Call this at the START of recalculateAfterChange() before recalculating
```

Also cache task list reads:
In `getProjectTasks` controller:
```javascript
const cacheKey = `tasks:${projectId}`
const cached = await redis.get(cacheKey)
if (cached) return res.json({ success: true, data: JSON.parse(cached) })

// ... fetch from DB ...

await redis.setex(cacheKey, 30, JSON.stringify(tasks))
// Invalidate this cache in: createTask, updateTask, deleteTask, updateTaskStatus
```

## Distributed Rate Limiting with Redis
Create `server/src/middleware/rateLimiter.js`:

```javascript
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { redis } from '../config/redis.js'

// General API rate limit: 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message: { success: false, error: 'Too many requests. Try again in 15 minutes.' }
})

// Strict limit for auth endpoints: 10 per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message: { success: false, error: 'Too many login attempts. Try again in 15 minutes.' }
})

// Graph recalculation limiter: prevent spam of recalculate calls
export const graphLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute window
  max: 30,                    // max 30 task mutations per minute per user
  keyGenerator: (req) => req.user?.id || req.ip,  // rate limit per user, not per IP
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  message: { success: false, error: 'Slow down! Too many task updates.' }
})
```

Apply in app.js:
```javascript
app.use('/api', generalLimiter)
app.use('/api/auth', authLimiter)
app.use('/api/projects/:projectId/tasks', graphLimiter)
```

## Frontend: Handle Rate Limit Errors
In the Axios response interceptor in `api.js`:
```javascript
// If error.response.status === 429 (Too Many Requests):
toast.error('Slow down! You\'re making too many changes.')
// Do not retry automatically
```

------- END OF FEATURE 2C PROMPT -------


# ---- FEATURE 2D: WHAT-IF SANDBOX ----
# git commit -m "feat: what-if sandbox mode for CPM simulation"

------- PASTE INTO CURSOR AGENT FOR FEATURE 2D -------

Build the What-If Sandbox feature. Users can simulate "what if task X takes 3 extra days?"
WITHOUT changing real project data. Everything runs on a copy.

## Backend: Sandbox API Endpoint
Add to task routes:
POST /api/projects/:projectId/sandbox

Request body:
```json
{
  "taskOverrides": [
    { "taskId": "abc123", "duration": 8 },
    { "taskId": "def456", "duration": 5 }
  ]
}
```

Controller `runSandbox(req, res, next)`:
- Fetch all real tasks for the project
- Apply the overrides: for each override, find the task and change its duration
  (do NOT save to database — only modify the in-memory copy)
- Run runCPM() on the modified copy
- Also run runCPM() on the original unmodified tasks
- Return:
  ```json
  {
    "success": true,
    "data": {
      "original": {
        "projectDuration": 20,
        "criticalPath": ["id1", "id2", "id3"]
      },
      "simulated": {
        "projectDuration": 25,
        "criticalPath": ["id1", "id4", "id3"],
        "tasks": [all tasks with new CPM values]
      },
      "impact": {
        "deadlineShift": 5,
        "criticalPathChanged": true,
        "newCriticalTasks": ["id4"],
        "freedCriticalTasks": ["id2"]
      }
    }
  }
  ```

## Frontend: Sandbox Mode Toggle
In `ProjectPage.jsx`, add a "What-If Sandbox" button in the project header.

When clicked:
- Show a blue banner: "🧪 SANDBOX MODE — Changes here don't affect the real project"
- The graph shows a slightly transparent/dimmed version of the real data
- Each task node shows a duration slider (0.5 to 30 days, step 0.5)

Create `client/src/components/SandboxPanel.jsx`:
```
SANDBOX MODE
─────────────────────────────────────────
Adjust task durations to see impact:

[ Build Auth API    ] [====|====] 5 days  (was 3)
[ Design UI         ] [===|=====] 4 days  (was 4)
[ Write Tests       ] [=====|===] 7 days  (was 5)

[RUN SIMULATION]
─────────────────────────────────────────
RESULTS:
Original deadline:    Day 20
Simulated deadline:   Day 25  ⚠️ +5 days

Critical path changed:
  Added:   "Build Auth API" (was off critical path)
  Removed: "Design UI" (now has float)

[CLOSE SANDBOX] [APPLY TO REAL PROJECT?]
```

When "Run Simulation" clicked:
- Call POST /api/projects/:projectId/sandbox with current slider values
- Show results in the panel
- In the graph: highlight new critical path in orange (vs real critical path in red)

"Apply to Real Project?" button:
- Show confirmation modal: "This will update the real task durations. Are you sure?"
- If confirmed: call PATCH on each modified task to update real durations

------- END OF FEATURE 2D PROMPT -------
