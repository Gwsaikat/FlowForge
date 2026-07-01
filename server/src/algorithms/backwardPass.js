import { buildGraph } from './graphUtils.js';

/**
 * CPM backward pass — compute LST, LFT, float, and isCritical.
 */
export function computeBackwardPass(tasks, topoOrder, projectDuration) {
  const { adjList } = buildGraph(tasks);
  const taskMap = new Map(tasks.map((t) => [String(t._id), { ...t }]));
  const reverseOrder = [...topoOrder].reverse();
  const result = [];

  for (const id of reverseOrder) {
    const task = taskMap.get(id);
    const successors = adjList.get(id) || [];

    let lft = projectDuration;
    if (successors.length > 0) {
      // LFT = earliest LST among successors
      lft = Math.min(...successors.map((sId) => taskMap.get(sId).lst));
    }

    const lst = lft - task.duration;
    const floatVal = lst - task.est;
    const isCritical = floatVal === 0;

    const updated = { ...task, lst, lft, float: floatVal, isCritical };
    taskMap.set(id, updated);
    result.unshift(updated);
  }

  return result;
}
