/**
 * Build adjacency maps from a tasks array for graph algorithms.
 */
export function buildGraph(tasks) {
  const inDegree = new Map();
  const adjList = new Map();
  const taskMap = new Map();

  for (const task of tasks) {
    const id = String(task._id);
    taskMap.set(id, task);
    inDegree.set(id, 0);
    adjList.set(id, []);
  }

  for (const task of tasks) {
    const id = String(task._id);
    const deps = (task.dependencies || []).map(String);

    for (const depId of deps) {
      inDegree.set(id, (inDegree.get(id) || 0) + 1);
      if (!adjList.has(depId)) adjList.set(depId, []);
      adjList.get(depId).push(id);
    }
  }

  return { inDegree, adjList, taskMap };
}

/**
 * Convert tasks to plain algorithm-friendly objects.
 */
export function toAlgoTasks(tasks) {
  return tasks.map((t) => ({
    _id: String(t._id),
    title: t.title,
    duration: t.duration,
    dependencies: (t.dependencies || []).map(String),
    est: t.est ?? 0,
    eft: t.eft ?? 0,
    lst: t.lst ?? 0,
    lft: t.lft ?? 0,
    float: t.float ?? 0,
    isCritical: t.isCritical ?? false,
    assignee: t.assignee ? String(t.assignee) : null,
    status: t.status,
  }));
}
