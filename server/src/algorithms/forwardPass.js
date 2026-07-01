/**
 * CPM forward pass — compute EST and EFT for each task in topological order.
 */
export function computeForwardPass(tasks, topoOrder) {
  const taskMap = new Map(tasks.map((t) => [String(t._id), { ...t }]));
  const result = [];

  for (const id of topoOrder) {
    const task = taskMap.get(id);
    const deps = (task.dependencies || []).map(String);

    let est = 0;
    if (deps.length > 0) {
      // EST = latest EFT among all predecessors
      est = Math.max(...deps.map((depId) => taskMap.get(depId).eft));
    }

    const eft = est + task.duration;
    const updated = { ...task, est, eft };
    taskMap.set(id, updated);
    result.push(updated);
  }

  return result;
}

/**
 * Calculate project duration as max EFT of tasks with no successors.
 */
export function getProjectDuration(tasks, adjList) {
  const finalTasks = tasks.filter((t) => {
    const id = String(t._id);
    return (adjList.get(id) || []).length === 0;
  });
  if (finalTasks.length === 0) return Math.max(...tasks.map((t) => t.eft));
  return Math.max(...finalTasks.map((t) => t.eft));
}
