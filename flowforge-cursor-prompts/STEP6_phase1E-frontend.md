# ============================================================
# PHASE 1E — REACT FRONTEND + GRAPH VISUALIZATION
# ============================================================
# WHEN TO USE: After backend API is tested and working.
# EXPECTED RESULT: Full working UI — dashboard, project view, task graph.
# TIME: ~40 minutes
# COMMIT AFTER: git commit -m "feat: complete frontend with graph visualization"
# ============================================================

------- PASTE INTO CURSOR AGENT -------

Build the complete React frontend for FlowForge. Focus on functionality first, clean UI second.

## Design System — Define These CSS Variables First
Create `client/src/index.css` with these CSS custom properties:
```css
:root {
  --bg-primary: #0F1117;
  --bg-secondary: #1A1F2E;
  --bg-card: #242938;
  --accent-blue: #4F8EF7;
  --accent-green: #00E5A0;
  --accent-orange: #FF8C42;
  --accent-red: #FF4D6D;
  --accent-purple: #9B59B6;
  --text-primary: #EAEEF5;
  --text-secondary: #8892A4;
  --border: #2E3446;
  --critical-color: #FF4D6D;    /* tasks on critical path */
  --safe-color: #00E5A0;        /* tasks with comfortable float */
  --warning-color: #FF8C42;     /* tasks with low float */
}
```

## Dashboard Page
Build `client/src/pages/DashboardPage.jsx`:

Top navigation bar:
- FlowForge logo/name on left
- User name + logout button on right
- Logout calls logoutUser() from authService, clears Zustand store, navigates to /login

Main content:
- Heading: "Your Projects"
- "New Project" button that opens a modal
- Grid of ProjectCard components (one per project)

ProjectCard component (`client/src/components/ProjectCard.jsx`):
- Shows: project name, description, member count, status badge
- Shows project deadline if set
- Click anywhere on card navigates to /projects/:projectId

Create New Project Modal:
- Fields: Name (required), Description, Deadline (date picker)
- On submit: call POST /api/projects, add to Zustand projects store, close modal, navigate to new project

On page load: call GET /api/projects, set in Zustand store.

## Project Page — This Is The Main Screen
Build `client/src/pages/ProjectPage.jsx`:

This page has two main sections side by side:
1. LEFT PANEL (30% width): Task list + controls
2. RIGHT PANEL (70% width): The graph canvas

### Left Panel
Header: project name + status badge + member count

"Add Task" button → opens Add Task modal

Task List:
- Each task shows: title, duration, assignee name, status badge, DPS score
- Color code status: pending=gray, active=blue, blocked=red, delayed=orange, done=green
- Click a task → opens Task Detail side drawer
- Critical path tasks have a red left border

Add Task Modal (`client/src/components/AddTaskModal.jsx`):
- Fields:
  - Title (required)
  - Description (optional)
  - Duration in days (required, number input, min 0.5, step 0.5)
  - Assignee (dropdown of project members)
  - Dependencies (multi-select of existing project tasks)
- On submit: POST /api/projects/:projectId/tasks
- On success: close modal, update task list, graph re-renders

Task Detail Drawer (`client/src/components/TaskDetailDrawer.jsx`):
A slide-in panel from the right showing:
- Task title (editable inline)
- Status dropdown: pending/active/blocked/delayed/done
  - When status changes: call PATCH /api/projects/:id/tasks/:id/status
  - If status changes to blocked/delayed: show "Blast Radius" section
- Duration (editable)
- Assignee (editable dropdown)
- CPM Data Section (styled like a stats panel):
  ```
  Earliest Start:    Day 3
  Earliest Finish:   Day 7
  Latest Start:      Day 3
  Latest Finish:     Day 7
  Float/Slack:       0 days
  Status:            🔴 CRITICAL PATH
  ```
- Dependencies section: list of tasks this depends on, with ability to add/remove

### Blast Radius Panel (`client/src/components/BlastRadiusPanel.jsx`)
Shown when a task is marked as blocked or delayed.
Receives the cascadeResult from the API response.
Shows:
- Big number: "⚠️ Project delayed by X days"
- List of affected tasks with their titles
- Severity badge: CRITICAL / MODERATE / MINOR
- "Notify All Affected Members" button (just shows a toast for now)

### Right Panel — The Graph Canvas
Build `client/src/components/GraphCanvas.jsx` using React Flow:

Setup React Flow:
```jsx
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow'
import 'reactflow/dist/style.css'
```

Convert tasks from Zustand to React Flow nodes and edges:
```javascript
// Convert tasks to nodes
const nodes = tasks.map(task => ({
  id: task._id,
  type: 'taskNode',    // custom node type
  position: { x: task.est * 120, y: getTaskRowPosition(task) },
  data: { task }
}))

// Convert dependencies to edges
const edges = tasks.flatMap(task =>
  task.dependencies.map(depId => ({
    id: `${depId}-${task._id}`,
    source: depId,
    target: task._id,
    animated: task.isCritical,         // animate edges on critical path
    style: { stroke: task.isCritical ? '#FF4D6D' : '#4F8EF7', strokeWidth: 2 }
  }))
)
```

Custom Node Component (`client/src/components/TaskNode.jsx`):
```jsx
// Each task shows as a card with:
// - Task title
// - Duration badge
// - Assignee avatar (initials circle)
// - Float display: "Float: 0d" in red if critical, green if safe
// - Border color based on status
// Border: red if isCritical, green if done, orange if blocked/delayed, blue otherwise
```

Graph positioning algorithm (simple):
- Group tasks by topological "level" (tasks at the same depth)
- Tasks in the same level get the same X position
- Within a level, space them vertically
- This gives a left-to-right flow layout

Controls:
- React Flow's built-in Controls component (zoom in/out/fit)
- Background with dots pattern
- MiniMap in bottom right corner

When a task is clicked on the graph → open the Task Detail drawer (same as clicking in left panel)

## Real-Time Socket.io Integration
Create `client/src/hooks/useProjectSocket.js`:
```javascript
// Custom hook that:
// 1. On mount: connect socket, join project room
//    socket.emit('join:project', { projectId, userId })
// 2. Listen for 'graph:updated' event → call GET /tasks again → update Zustand
// 3. Listen for 'task:blocked' event → show BlastRadiusPanel as a toast/modal
// 4. On unmount: leave room, disconnect socket
//    socket.emit('leave:project', { projectId })
```

Use this hook at the top of ProjectPage:
```javascript
useProjectSocket(projectId)
```

## Socket.io Server Side
Create `server/src/socket/projectSocket.js`:
```javascript
// Handle these events:
// 'join:project' → socket.join(`project:${projectId}`)
// 'leave:project' → socket.leave(`project:${projectId}`)
```

In server.js, set up socket connection:
```javascript
io.on('connection', (socket) => {
  projectSocket(socket)
})
```

## Zustand Store Updates for Graph
In `useGraphStore`, add:
- `loadProjectData(projectId)` action that:
  1. Calls GET /api/projects/:projectId → sets currentProject
  2. Calls GET /api/projects/:projectId/tasks → sets tasks
  3. Converts tasks to nodes and edges for React Flow

## Navigation Flow Summary
```
/login
  → successful login
    → /dashboard (shows all projects)
      → click project card
        → /projects/:projectId (shows task list + graph)
          → click task → Task Detail Drawer slides in
          → add task → Add Task Modal opens
```

## Loading and Error States
Every data fetch must show:
- Loading: a spinner centered in the relevant area
- Error: "Failed to load [thing]. Try again." with a retry button
- Empty: "No tasks yet. Add your first task." with an Add Task button

## Final Polish
- Use react-hot-toast for: task created, task updated, error messages, copy to clipboard
- All buttons must be disabled and show loading spinner during API calls
- Smooth transitions on drawer open/close (CSS transition: transform 300ms ease)

------- END OF PROMPT -------
