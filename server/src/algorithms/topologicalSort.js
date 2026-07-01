import { buildGraph } from './graphUtils.js';

/**
 * Kahn's algorithm — returns task IDs in valid processing order, or null if cycle exists.
 */
export function topologicalSort(tasks) {
  if (!tasks || tasks.length === 0) return [];

  const { inDegree, adjList } = buildGraph(tasks);
  const degrees = new Map(inDegree);
  const queue = [];

  for (const [id, deg] of degrees) {
    if (deg === 0) queue.push(id);
  }

  const order = [];

  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);

    for (const successor of adjList.get(current) || []) {
      degrees.set(successor, degrees.get(successor) - 1);
      if (degrees.get(successor) === 0) queue.push(successor);
    }
  }

  if (order.length !== tasks.length) return null;
  return order;
}

/**
 * Returns true if the task graph contains a circular dependency.
 */
export function hasCycle(tasks) {
  return topologicalSort(tasks) === null;
}
