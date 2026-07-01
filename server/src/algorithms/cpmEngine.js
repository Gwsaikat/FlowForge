import { buildGraph } from './graphUtils.js';
import { hasCycle, topologicalSort } from './topologicalSort.js';
import { computeForwardPass, getProjectDuration } from './forwardPass.js';
import { computeBackwardPass } from './backwardPass.js';
import { computeCascadeImpact } from './cascadeImpact.js';

/**
 * Run full CPM analysis on a task graph.
 */
export function runCPM(tasks) {
  if (!tasks || tasks.length === 0) {
    return {
      tasks: [],
      criticalPath: [],
      projectDuration: 0,
      criticalPathDuration: 0,
    };
  }

  const normalized = tasks.map((t) => ({
    ...t,
    _id: String(t._id),
    dependencies: (t.dependencies || []).map(String),
  }));

  if (hasCycle(normalized)) {
    throw new Error('Circular dependency detected');
  }

  const topoOrder = topologicalSort(normalized);
  const forwardTasks = computeForwardPass(normalized, topoOrder);
  const { adjList } = buildGraph(forwardTasks);
  const projectDuration = getProjectDuration(forwardTasks, adjList);
  const finalTasks = computeBackwardPass(forwardTasks, topoOrder, projectDuration);

  const criticalPath = topoOrder.filter((id) => {
    const t = finalTasks.find((task) => String(task._id) === id);
    return t?.isCritical;
  });

  return {
    tasks: finalTasks,
    criticalPath,
    projectDuration,
    criticalPathDuration: projectDuration,
  };
}

export { computeCascadeImpact };
