import { topologicalSort } from './topologicalSort.js';

/**
 * Check if adding edge from→to would create a cycle (to depends on from).
 */
export function wouldCreateCycle(tasks, newFromId, newToId) {
  const fromId = String(newFromId);
  const toId = String(newToId);

  const modified = tasks.map((t) => {
    const id = String(t._id);
    if (id === toId) {
      const deps = [...(t.dependencies || []).map(String)];
      if (!deps.includes(fromId)) deps.push(fromId);
      return { ...t, _id: id, dependencies: deps };
    }
    return { ...t, _id: id, dependencies: (t.dependencies || []).map(String) };
  });

  const order = topologicalSort(modified);
  if (order !== null) return { wouldCycle: false, cyclePath: null };

  return { wouldCycle: true, cyclePath: [fromId, toId] };
}
