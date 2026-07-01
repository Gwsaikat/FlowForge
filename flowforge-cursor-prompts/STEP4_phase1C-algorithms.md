# ============================================================
# PHASE 1C — THE ALGORITHM ENGINE (Heart of FlowForge)
# ============================================================
# WHEN TO USE: After auth is working. This is the most important step.
# HOW TO USE: Paste into Cursor Agent. Read the output carefully.
#             Understand what Cursor generates — these are YOUR algorithms.
# EXPECTED RESULT: 5 pure JS algorithm functions + full unit tests.
# TIME: ~30 minutes
# COMMIT AFTER: git commit -m "feat: implement CPM algorithm engine"
# ============================================================

------- PASTE INTO CURSOR AGENT -------

Build the complete algorithm engine for FlowForge. This is the most critical part of the project.
All algorithms must be PURE FUNCTIONS — they take data in, return results out.
They must NOT touch the database, make HTTP requests, or have side effects.
Every function must have JSDoc comments explaining what it does in plain English.

## The Data Structure All Algorithms Work With
All algorithms receive a `tasks` array where each task looks like this:
```javascript
{
  _id: "task_id_string",
  title: "Build Login API",
  duration: 3,               // estimated days to complete
  dependencies: ["other_task_id", "another_task_id"],  // IDs of tasks that must finish BEFORE this one
  est: 0,   // will be filled by algorithm
  eft: 0,   // will be filled by algorithm
  lst: 0,   // will be filled by algorithm
  lft: 0,   // will be filled by algorithm
  float: 0, // will be filled by algorithm
  isCritical: false  // will be filled by algorithm
}
```

## Algorithm 1: Build Adjacency Map
Create `server/src/algorithms/graphUtils.js`:

Function `buildGraph(tasks)`:
- Takes the tasks array
- Returns an object with two maps:
  - `inDegree`: Map of taskId → number of tasks that must complete before it (incoming edges)
  - `adjList`: Map of taskId → array of taskIds that DEPEND ON this task (outgoing edges)
  - `taskMap`: Map of taskId → the full task object (for quick lookup)
- Comment explaining: inDegree is how many prerequisites a task has.
  adjList is the list of tasks that are waiting for this task to finish.

Example:
```
Tasks: A→B, A→C, B→D
inDegree: { A:0, B:1, C:1, D:1 }
adjList:  { A:[B,C], B:[D], C:[], D:[] }
```

## Algorithm 2: Topological Sort (Kahn's Algorithm)
Create `server/src/algorithms/topologicalSort.js`:

Function `topologicalSort(tasks)`:
- Input: tasks array
- Build the graph using buildGraph()
- Implement Kahn's algorithm:
  1. Start with a queue containing all tasks with inDegree === 0 (no prerequisites)
  2. While the queue is not empty:
     a. Dequeue a task, add its ID to the result order
     b. For each task in adjList[current], decrement its inDegree by 1
     c. If a task's inDegree reaches 0, add it to the queue
  3. If result order length !== total tasks → there is a cycle (return null)
- Returns: array of task IDs in valid processing order, OR null if cycle exists
- Add plain English comments above every step

Function `hasCycle(tasks)`:
- Returns true if topologicalSort returns null (cycle detected), false otherwise
- This is the "safety check" called before accepting a new dependency

## Algorithm 3: Cycle Detection for New Edge
Create `server/src/algorithms/cycleDetection.js`:

Function `wouldCreateCycle(tasks, newFromId, newToId)`:
- Called BEFORE adding a new dependency where newToId depends on newFromId
- (meaning: newFromId must finish before newToId can start)
- Temporarily add the new edge to the tasks array
- Run topologicalSort on the modified array
- If result is null → the new edge would create a cycle → return true
- Remove the temporary edge → return false
- Also return the cycle path if possible (array of task IDs forming the cycle)

## Algorithm 4: CPM Forward Pass
Create `server/src/algorithms/forwardPass.js`:

Function `computeForwardPass(tasks, topoOrder)`:
- Input: tasks array + topoOrder (from topologicalSort)
- For each task in topological order:
  - If the task has NO dependencies → EST = 0
  - If the task HAS dependencies → EST = maximum(EFT of all predecessor tasks)
    (Because you can only start once ALL your prerequisites are done — take the latest one)
  - EFT = EST + duration
- Returns: tasks array with est and eft filled in for every task
- Comments: explain that EST of a task is the EARLIEST it can possibly start,
  which is the moment when the last of its predecessors finishes.

Visual example to put in comments:
```
Task A: duration=2, no deps → EST=0, EFT=2
Task B: duration=3, depends on A → EST=2, EFT=5
Task C: duration=1, depends on A → EST=2, EFT=3
Task D: duration=4, depends on B and C → EST=max(5,3)=5, EFT=9
Project duration = max EFT of all tasks with no successors = 9
```

## Algorithm 5: CPM Backward Pass
Create `server/src/algorithms/backwardPass.js`:

Function `computeBackwardPass(tasks, topoOrder, projectDuration)`:
- Input: tasks with est/eft filled, topoOrder, projectDuration (max EFT of all final tasks)
- Process tasks in REVERSE topological order:
  - If the task has NO successors (nothing depends on it) → LFT = projectDuration
  - If the task HAS successors → LFT = minimum(LST of all successor tasks)
    (The task must finish before the earliest of its successors needs to start)
  - LST = LFT - duration
  - Float = LST - EST (or equivalently LFT - EFT)
  - isCritical = (Float === 0)
- Returns: tasks array with lst, lft, float, isCritical filled in
- Comments: explain that LST is the LATEST this task can start without delaying the project.
  Float is how many days of slack it has. Zero float = on the critical path.

## Algorithm 6: Master CPM Orchestrator
Create `server/src/algorithms/cpmEngine.js`:

Function `runCPM(tasks)`:
- This is the single function called by the rest of the app
- Step 1: Validate input — if tasks is empty or null, return empty result
- Step 2: Check for cycles using hasCycle() — if found, throw Error("Circular dependency detected")
- Step 3: Run topologicalSort() to get processing order
- Step 4: Run computeForwardPass() to get EST and EFT
- Step 5: Calculate projectDuration = max(eft) of all tasks that have no successors
- Step 6: Run computeBackwardPass() to get LST, LFT, Float, isCritical
- Step 7: Identify the critical path = array of task IDs where isCritical === true, in order
- Returns:
  ```javascript
  {
    tasks: [...tasks with all CPM fields filled],
    criticalPath: [taskId1, taskId2, taskId3],  // ordered critical path
    projectDuration: 9,                          // total project days
    criticalPathDuration: 9                      // length of critical chain
  }
  ```

## Algorithm 7: Cascade Impact (Blast Radius)
Create `server/src/algorithms/cascadeImpact.js`:

Function `computeCascadeImpact(tasks, blockedTaskId, delayDays)`:
- Called when a task is marked as Delayed or Blocked
- Uses BFS (Breadth-First Search) starting from blockedTaskId
- For each task reachable from blockedTaskId via dependency edges:
  - Calculate how much its EST shifts due to the delay
  - Collect the affected task IDs
- Re-run full CPM on the modified graph (with the delay applied)
- Compare old projectDuration vs new projectDuration
- Returns:
  ```javascript
  {
    affectedTaskIds: ["id1", "id2", "id3"],  // all tasks impacted
    deadlineShift: 3,                         // how many days project deadline moves
    newProjectDuration: 12,                   // new total project days
    oldProjectDuration: 9,
    newCriticalPath: [...],
    severity: "critical" | "moderate" | "minor"
    // critical: deadline shifts, moderate: float reduced but deadline ok, minor: within float
  }
  ```

## Unit Tests — ALL OF THESE MUST PASS
Create `server/src/algorithms/__tests__/cpm.test.js`:

### Test Suite 1: Topological Sort
```
Test 1: Simple linear chain A→B→C returns [A, B, C]
Test 2: Diamond shape (A→B, A→C, B→D, C→D) returns valid order with A first, D last
Test 3: Cycle (A→B→C→A) returns null
Test 4: Single task with no deps returns [task]
Test 5: Two independent tasks returns both (order doesn't matter)
```

### Test Suite 2: Forward Pass
```
Test 6: Linear chain A(2)→B(3)→C(1): A EST=0 EFT=2, B EST=2 EFT=5, C EST=5 EFT=6
Test 7: Diamond A(2)→B(3), A(2)→C(5), B+C→D(1): D EST=max(5,7)=7, EFT=8
Test 8: Single task duration=5: EST=0, EFT=5
```

### Test Suite 3: Backward Pass
```
Test 9: Linear chain A(2)→B(3)→C(1), projectDuration=6:
  C: LFT=6, LST=5, float=0 (critical)
  B: LFT=5, LST=2, float=0 (critical)
  A: LFT=2, LST=0, float=0 (critical)

Test 10: A(2)→B(3)→D(1) and A(2)→C(5)→D(1), projectDuration=8:
  B: float=2 (NOT critical), C: float=0 (critical), D: float=0 (critical)

Test 11: isCritical is true ONLY when float === 0
```

### Test Suite 4: Full CPM Integration
```
Test 12: Run runCPM() on a 5-task project, verify critical path is correct
Test 13: runCPM() on empty array returns empty result without error
Test 14: runCPM() on circular dependency throws error with message "Circular dependency"
```

### Test Suite 5: Cascade Impact
```
Test 15: Delay a task on the critical path by 3 days → deadlineShift === 3
Test 16: Delay a task NOT on critical path by 2 days (float=5) → deadlineShift === 0
Test 17: affectedTaskIds includes all downstream tasks, not upstream
```

Run all tests with: `cd server && npx jest algorithms`
All 17 tests must pass before moving to the next step.

------- END OF PROMPT -------
