import { buildGraph } from './graphUtils.js';

/**
 * DFS reachability check from start to target without using a specific edge.
 */
function isReachableWithoutEdge(adjList, start, target, skipFrom, skipTo) {
  const visited = new Set();
  const stack = [start];

  while (stack.length > 0) {
    const node = stack.pop();
    if (node === target) return true;
    if (visited.has(node)) continue;
    visited.add(node);

    for (const next of adjList.get(node) || []) {
      if (node === skipFrom && next === skipTo) continue;
      stack.push(next);
    }
  }
  return false;
}

function findRedundantEdges(tasks, adjList, taskMap) {
  const redundant = [];

  for (const task of tasks) {
    const toId = String(task._id);
    for (const depId of (task.dependencies || []).map(String)) {
      if (isReachableWithoutEdge(adjList, depId, toId, depId, toId)) {
        const fromTitle = taskMap.get(depId)?.title || depId;
        redundant.push({
          from: depId,
          to: toId,
          reason: `Already implied by path via ${fromTitle}`,
        });
      }
    }
  }
  return redundant;
}

function findGodTasks(tasks, adjList) {
  const godTasks = [];
  for (const task of tasks) {
    const id = String(task._id);
    const dependentCount = (adjList.get(id) || []).length;
    if (dependentCount >= 5) {
      godTasks.push({
        taskId: id,
        title: task.title,
        dependentCount,
        risk: 'HIGH',
      });
    }
  }
  return godTasks;
}

function findLongChains(tasks, adjList, inDegree) {
  const chains = [];
  const visited = new Set();

  for (const task of tasks) {
    const id = String(task._id);
    if (visited.has(id)) continue;
    if ((inDegree.get(id) || 0) !== 0) continue;

    const chain = [id];
    let current = id;

    while (true) {
      const successors = adjList.get(current) || [];
      if (successors.length !== 1) break;
      const next = successors[0];
      if ((inDegree.get(next) || 0) !== 1) break;
      chain.push(next);
      current = next;
    }

    chain.forEach((cid) => visited.add(cid));

    if (chain.length >= 6) {
      const chainDuration = chain.reduce((sum, cid) => {
        const t = tasks.find((task) => String(task._id) === cid);
        return sum + (t?.duration || 0);
      }, 0);
      chains.push({ chainTaskIds: chain, length: chain.length, chainDuration });
    }
  }
  return chains;
}

function findOrphanedTasks(tasks, adjList, inDegree) {
  if (tasks.length <= 1) return [];
  const orphaned = [];

  for (const task of tasks) {
    const id = String(task._id);
    const hasDeps = (inDegree.get(id) || 0) > 0;
    const hasDependents = (adjList.get(id) || []).length > 0;
    if (!hasDeps && !hasDependents) {
      orphaned.push({ taskId: id, title: task.title });
    }
  }
  return orphaned;
}

function calculateHealthScore(taskCount, smellCount) {
  if (taskCount === 0) return 100;
  const score = 100 - smellCount * 10;
  return Math.max(0, Math.min(100, score));
}

/**
 * Detect structural problems in the dependency graph.
 */
export function detectDependencySmells(tasks) {
  const { adjList, inDegree, taskMap } = buildGraph(tasks);

  const redundantEdges = findRedundantEdges(tasks, adjList, taskMap);
  const godTasks = findGodTasks(tasks, adjList);
  const longChains = findLongChains(tasks, adjList, inDegree);
  const orphanedTasks = findOrphanedTasks(tasks, adjList, inDegree);

  const totalSmells =
    redundantEdges.length + godTasks.length + longChains.length + orphanedTasks.length;

  return {
    redundantEdges,
    godTasks,
    longChains,
    orphanedTasks,
    totalSmells,
    healthScore: calculateHealthScore(tasks.length, totalSmells),
  };
}
