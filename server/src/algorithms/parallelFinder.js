import { buildGraph } from './graphUtils.js';

/**
 * Check if taskA can reach taskB via dependency edges.
 */
function canReach(adjList, from, to) {
  const visited = new Set();
  const stack = [from];

  while (stack.length > 0) {
    const node = stack.pop();
    if (node === to) return true;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const next of adjList.get(node) || []) {
      stack.push(next);
    }
  }
  return false;
}

function windowsOverlap(a, b) {
  return a.est < b.eft && b.est < a.eft;
}

/**
 * Find groups of tasks that could run in parallel.
 */
export function findParallelOpportunities(tasks) {
  if (!tasks || tasks.length < 2) return [];

  const { adjList } = buildGraph(tasks);
  const opportunities = [];
  const n = tasks.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = tasks[i];
      const b = tasks[j];
      const aId = String(a._id);
      const bId = String(b._id);

      const related =
        canReach(adjList, aId, bId) || canReach(adjList, bId, aId);
      if (related) continue;
      if (!windowsOverlap(a, b)) continue;

      const sameAssignee =
        a.assignee && b.assignee && String(a.assignee) === String(b.assignee);
      if (sameAssignee) continue;

      const sequentialTime = a.duration + b.duration;
      const parallelTime = Math.max(a.duration, b.duration);
      const timeSaved = sequentialTime - parallelTime;

      if (timeSaved <= 0) continue;

      opportunities.push({
        tasks: [a, b],
        timeSaved,
        timeWindow: {
          start: Math.min(a.est, b.est),
          end: Math.max(a.eft, b.eft),
        },
        assigneesNeeded: [a.assignee, b.assignee].filter(Boolean),
        isCurrentlyParallel: a.est === b.est,
      });
    }
  }

  return opportunities.sort((x, y) => y.timeSaved - x.timeSaved);
}
