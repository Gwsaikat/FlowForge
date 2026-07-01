import { runCPM } from './cpmEngine.js';
import { buildGraph } from './graphUtils.js';

/**
 * BFS cascade impact when a task is blocked or delayed.
 */
export function computeCascadeImpact(tasks, blockedTaskId, delayDays = 0) {
  const blockedId = String(blockedTaskId);
  const normalized = tasks.map((t) => ({
    ...t,
    _id: String(t._id),
    dependencies: (t.dependencies || []).map(String),
  }));

  let oldResult;
  try {
    oldResult = runCPM(normalized);
  } catch {
    oldResult = { projectDuration: 0, criticalPath: [], tasks: normalized };
  }

  const { adjList } = buildGraph(normalized);
  const affectedTaskIds = new Set();
  const queue = [blockedId];
  affectedTaskIds.add(blockedId);

  while (queue.length > 0) {
    const current = queue.shift();
    for (const successor of adjList.get(current) || []) {
      if (!affectedTaskIds.has(successor)) {
        affectedTaskIds.add(successor);
        queue.push(successor);
      }
    }
  }

  const modified = normalized.map((t) => {
    if (String(t._id) === blockedId) {
      return { ...t, duration: t.duration + delayDays };
    }
    return t;
  });

  let newResult;
  try {
    newResult = runCPM(modified);
  } catch {
    newResult = oldResult;
  }

  const deadlineShift = newResult.projectDuration - oldResult.projectDuration;

  let severity = 'minor';
  if (deadlineShift > 0) severity = 'critical';
  else if (deadlineShift === 0) {
    const blockedTask = oldResult.tasks.find((t) => String(t._id) === blockedId);
    if (blockedTask && blockedTask.float <= delayDays) severity = 'moderate';
  }

  return {
    affectedTaskIds: [...affectedTaskIds],
    deadlineShift,
    newProjectDuration: newResult.projectDuration,
    oldProjectDuration: oldResult.projectDuration,
    newCriticalPath: newResult.criticalPath,
    severity,
  };
}
