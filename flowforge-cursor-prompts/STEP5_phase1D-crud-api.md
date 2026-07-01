# ============================================================
# PHASE 1D — PROJECTS + TASKS CRUD + GRAPH API
# ============================================================
# WHEN TO USE: After algorithms pass all 17 tests.
# EXPECTED RESULT: Full REST API for projects and tasks.
#                  CPM runs automatically after every task change.
# TIME: ~25 minutes
# COMMIT AFTER: git commit -m "feat: projects and tasks CRUD with CPM integration"
# ============================================================

------- PASTE INTO CURSOR AGENT -------

Build the Projects and Tasks API for FlowForge. The CPM algorithm must run automatically
after every task mutation. Follow .cursorrules exactly.

## MongoDB Models

### Project Model
Create `server/src/models/Project.js`:
```javascript
{
  name: { type: String, required: true, trim: true, maxLength: 100 },
  description: { type: String, trim: true, maxLength: 500 },
  owner: { type: ObjectId, ref: 'User', required: true },
  members: [{ type: ObjectId, ref: 'User' }],
  deadline: { type: Date },
  status: { type: String, enum: ['active', 'archived', 'completed'], default: 'active' },
  projectDuration: { type: Number, default: 0 },  // computed by CPM
  criticalPath: [{ type: ObjectId, ref: 'Task' }], // computed by CPM
  timestamps: true
}
```
Add index on `members` and `owner`.

### Task Model
Create `server/src/models/Task.js`:
```javascript
{
  projectId: { type: ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true, trim: true, maxLength: 200 },
  description: { type: String, trim: true },
  duration: { type: Number, required: true, min: 0.5 },  // days, minimum half a day
  assignee: { type: ObjectId, ref: 'User', default: null },
  dependencies: [{ type: ObjectId, ref: 'Task' }],  // THE GRAPH EDGES
  status: {
    type: String,
    enum: ['pending', 'active', 'blocked', 'delayed', 'done'],
    default: 'pending'
  },
  // CPM computed fields — set by algorithm, never manually
  est: { type: Number, default: 0 },
  eft: { type: Number, default: 0 },
  lst: { type: Number, default: 0 },
  lft: { type: Number, default: 0 },
  float: { type: Number, default: 0 },
  isCritical: { type: Boolean, default: false },
  dps: { type: Number, default: 100 },  // Deadline Pressure Score
  // Tracking fields
  estimatedDuration: { type: Number },  // original estimate (copied from duration at creation)
  actualStart: { type: Date, default: null },
  actualEnd: { type: Date, default: null },
  handoffLag: { type: Number, default: 0 },  // minutes between predecessor done and this started
  timestamps: true
}
```
Add indexes on `projectId` and `assignee`.

## Graph Recalculation Service
Create `server/src/services/graphService.js`:

This is the bridge between the API and the algorithm engine.

Function `recalculateGraph(projectId)`:
- Fetch ALL tasks for the project from MongoDB
- Map them to the format the algorithm expects (plain objects, not Mongoose docs)
- Call runCPM() from cpmEngine.js
- Bulk update all tasks in MongoDB with their new CPM values using bulkWrite
- Update the project document: set projectDuration and criticalPath
- Return the CPM result
- Wrap everything in try/catch — if CPM fails, log the error but do not crash the server

Function `recalculateAfterChange(projectId, io)`:
- Call recalculateGraph(projectId)
- After recalculation, emit a Socket.io event to the project room:
  io.to(`project:${projectId}`).emit('graph:updated', { projectId, updatedAt: new Date() })
- This is what triggers all connected clients to refresh their view

## Projects API

Create `server/src/controllers/projectController.js`:

`createProject(req, res, next)`:
- Validate: name required
- Create project with owner = req.user.id
- Add owner to members array automatically
- Return 201 with the new project

`getUserProjects(req, res, next)`:
- Find all projects where members array includes req.user.id
- Populate owner with name and email fields only
- Return 200 with projects array

`getProjectById(req, res, next)`:
- Find project by params.projectId
- Check that req.user.id is in the members array → 403 if not
- Populate members with name and email
- Populate criticalPath with task titles
- Return 200 with project

`updateProject(req, res, next)`:
- Only owner can update name, description, deadline, status
- Check req.user.id === project.owner → 403 if not owner
- Update and return 200

`deleteProject(req, res, next)`:
- Only owner can delete
- Delete project AND all associated tasks
- Return 200

`addMember(req, res, next)`:
- Only owner can add members
- Find user by email (from req.body.email)
- If already a member → 409
- Push to members array
- Return 200 with updated project

`removeMember(req, res, next)`:
- Only owner can remove members
- Cannot remove the owner themselves
- Pull from members array
- Return 200

Create `server/src/routes/projectRoutes.js`:
- All routes protected with authenticate middleware
- GET /api/projects → getUserProjects
- POST /api/projects → createProject
- GET /api/projects/:projectId → getProjectById
- PUT /api/projects/:projectId → updateProject
- DELETE /api/projects/:projectId → deleteProject
- POST /api/projects/:projectId/members → addMember
- DELETE /api/projects/:projectId/members/:userId → removeMember

## Tasks API

Create `server/src/controllers/taskController.js`:

`createTask(req, res, next)`:
- Validate: title, duration required; duration must be a positive number
- Verify req.user.id is a project member → 403 if not
- Set estimatedDuration = duration (copy it for drift tracking later)
- Validate dependencies array: each ID must be a valid task in this project
- Check that adding these dependencies would NOT create a cycle using wouldCreateCycle()
- If cycle detected → 409 "Adding this dependency would create a circular chain"
- Create the task
- Call recalculateAfterChange(projectId, io) — pass the Socket.io instance
- Return 201 with created task

`getProjectTasks(req, res, next)`:
- Verify project membership
- Find all tasks for projectId
- Populate assignee with name and email
- Return 200 with tasks array

`getTaskById(req, res, next)`:
- Verify project membership
- Populate assignee and dependencies
- Return 200 with task

`updateTask(req, res, next)`:
- Verify project membership
- Allowed fields to update: title, description, duration, assignee
- If duration changed: recalculate CPM after update
- Return 200 with updated task + trigger recalculation

`updateTaskStatus(req, res, next)`:
- This is the most important route — handles status changes
- Validate: status must be one of pending/active/blocked/delayed/done
- If new status is 'active' and task had no actualStart: set actualStart = now
- Calculate handoffLag: time between predecessor task actualEnd and this task actualStart
- If new status is 'done': set actualEnd = now
- If status is 'delayed' or 'blocked':
  - Call computeCascadeImpact() to get blast radius
  - Save cascadeResult for the Socket.io event payload
- Update task status in DB
- Call recalculateAfterChange(projectId, io)
- Emit a SEPARATE event: io.to(`project:${projectId}`).emit('task:blocked', { taskId, cascadeResult })
- Return 200 with updated task AND cascadeResult

`addDependency(req, res, next)`:
- req.body: { dependsOnTaskId }  — this task depends on dependsOnTaskId
- Validate both tasks exist and belong to the same project
- Check wouldCreateCycle() — if yes → 409 with which tasks form the cycle
- Push dependsOnTaskId to task.dependencies
- Trigger recalculation
- Return 200

`removeDependency(req, res, next)`:
- Remove dependsOnTaskId from task.dependencies
- Trigger recalculation
- Return 200

`deleteTask(req, res, next)`:
- Remove the task
- Remove this taskId from any other task's dependencies array using:
  Task.updateMany({ projectId }, { $pull: { dependencies: taskId } })
- Trigger recalculation
- Return 200

Create `server/src/routes/taskRoutes.js`:
- All routes: authenticate + project membership check
- GET /api/projects/:projectId/tasks → getProjectTasks
- POST /api/projects/:projectId/tasks → createTask
- GET /api/projects/:projectId/tasks/:taskId → getTaskById
- PUT /api/projects/:projectId/tasks/:taskId → updateTask
- PATCH /api/projects/:projectId/tasks/:taskId/status → updateTaskStatus
- POST /api/projects/:projectId/tasks/:taskId/dependencies → addDependency
- DELETE /api/projects/:projectId/tasks/:taskId/dependencies/:depId → removeDependency
- DELETE /api/projects/:projectId/tasks/:taskId → deleteTask

Mount task routes in app.js.

## Passing Socket.io to Controllers
In server.js, after initializing Socket.io, attach it to the Express app:
```javascript
app.set('io', io)
```

In controllers, access it via:
```javascript
const io = req.app.get('io')
```

## Manual Testing Checklist
Test these in order using Postman or Thunder Client:

1. Create a project → should return project with owner set
2. Create Task A (duration: 3, no dependencies) → CPM should run (float=0, isCritical=true)
3. Create Task B (duration: 2, depends on Task A) → A: float=0, B: float=0, projectDuration=5
4. Create Task C (duration: 1, depends on Task A) → A: float=0, B: float=0, C: float=2
5. Try to add dependency C→A (would create cycle) → should get 409 error
6. Mark Task A as 'blocked' → should get cascadeResult showing B and C affected
7. Delete Task A → B and C dependencies should be cleaned automatically

------- END OF PROMPT -------
