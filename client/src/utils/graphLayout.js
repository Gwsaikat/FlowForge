/**
 * Convert tasks to React Flow nodes and edges with level-based layout.
 */
export function tasksToGraph(tasks, highlightEdges = [], highlightNodes = []) {
  if (!tasks?.length) return { nodes: [], edges: [] };

  const levels = computeLevels(tasks);
  const levelGroups = {};

  tasks.forEach((task) => {
    const level = levels.get(task._id) ?? 0;
    if (!levelGroups[level]) levelGroups[level] = [];
    levelGroups[level].push(task);
  });

  const nodes = tasks.map((task) => {
    const level = levels.get(task._id) ?? 0;
    const group = levelGroups[level];
    const indexInLevel = group.indexOf(task);
    const isHighlighted = highlightNodes.includes(task._id);

    return {
      id: task._id,
      type: 'taskNode',
      position: { x: level * 220, y: indexInLevel * 120 + 50 },
      data: { task, isHighlighted },
    };
  });

  const edges = tasks.flatMap((task) =>
    (task.dependencies || []).map((depId) => {
      const dep = typeof depId === 'object' ? depId._id : depId;
      const edgeId = `${dep}-${task._id}`;
      const isHighlighted = highlightEdges.some(
        (e) => e.from === dep && e.to === task._id
      );

      return {
        id: edgeId,
        source: dep,
        target: task._id,
        animated: task.isCritical,
        style: {
          stroke: isHighlighted
            ? '#FFD700'
            : task.isCritical
              ? '#FF4D6D'
              : '#4F8EF7',
          strokeWidth: isHighlighted ? 3 : 2,
        },
      };
    })
  );

  return { nodes, edges };
}

function computeLevels(tasks) {
  const levels = new Map();
  const taskMap = new Map(tasks.map((t) => [t._id, t]));

  function getLevel(taskId, visited = new Set()) {
    if (levels.has(taskId)) return levels.get(taskId);
    if (visited.has(taskId)) return 0;
    visited.add(taskId);

    const task = taskMap.get(taskId);
    if (!task || !task.dependencies?.length) {
      levels.set(taskId, 0);
      return 0;
    }

    const deps = task.dependencies.map((d) => (typeof d === 'object' ? d._id : d));
    const maxDep = Math.max(...deps.map((d) => getLevel(d, visited)));
    const level = maxDep + 1;
    levels.set(taskId, level);
    return level;
  }

  tasks.forEach((t) => getLevel(t._id));
  return levels;
}
