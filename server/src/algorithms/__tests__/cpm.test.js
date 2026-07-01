import { topologicalSort, hasCycle } from '../topologicalSort.js';
import { computeForwardPass } from '../forwardPass.js';
import { computeBackwardPass } from '../backwardPass.js';
import { runCPM, computeCascadeImpact } from '../cpmEngine.js';
import { buildGraph } from '../graphUtils.js';

const id = (s) => s;

function makeTask(_id, duration, dependencies = []) {
  return { _id: id(_id), title: _id, duration, dependencies: dependencies.map(id) };
}

describe('Topological Sort', () => {
  test('Simple linear chain A→B→C returns [A, B, C]', () => {
    const tasks = [
      makeTask('A', 1),
      makeTask('B', 1, ['A']),
      makeTask('C', 1, ['B']),
    ];
    expect(topologicalSort(tasks)).toEqual(['A', 'B', 'C']);
  });

  test('Diamond shape returns valid order with A first, D last', () => {
    const tasks = [
      makeTask('A', 2),
      makeTask('B', 3, ['A']),
      makeTask('C', 5, ['A']),
      makeTask('D', 1, ['B', 'C']),
    ];
    const order = topologicalSort(tasks);
    expect(order[0]).toBe('A');
    expect(order[order.length - 1]).toBe('D');
    expect(order).toHaveLength(4);
  });

  test('Cycle (A→B→C→A) returns null', () => {
    const tasks = [
      makeTask('A', 1, ['C']),
      makeTask('B', 1, ['A']),
      makeTask('C', 1, ['B']),
    ];
    expect(topologicalSort(tasks)).toBeNull();
    expect(hasCycle(tasks)).toBe(true);
  });

  test('Single task with no deps returns [task]', () => {
    const tasks = [makeTask('A', 5)];
    expect(topologicalSort(tasks)).toEqual(['A']);
  });

  test('Two independent tasks returns both', () => {
    const tasks = [makeTask('A', 1), makeTask('B', 2)];
    const order = topologicalSort(tasks);
    expect(order).toHaveLength(2);
    expect(order).toContain('A');
    expect(order).toContain('B');
  });
});

describe('Forward Pass', () => {
  test('Linear chain A(2)→B(3)→C(1)', () => {
    const tasks = [
      makeTask('A', 2),
      makeTask('B', 3, ['A']),
      makeTask('C', 1, ['B']),
    ];
    const order = topologicalSort(tasks);
    const result = computeForwardPass(tasks, order);
    const map = Object.fromEntries(result.map((t) => [t._id, t]));
    expect(map.A.est).toBe(0);
    expect(map.A.eft).toBe(2);
    expect(map.B.est).toBe(2);
    expect(map.B.eft).toBe(5);
    expect(map.C.est).toBe(5);
    expect(map.C.eft).toBe(6);
  });

  test('Diamond D EST=max(5,7)=7, EFT=8', () => {
    const tasks = [
      makeTask('A', 2),
      makeTask('B', 3, ['A']),
      makeTask('C', 5, ['A']),
      makeTask('D', 1, ['B', 'C']),
    ];
    const order = topologicalSort(tasks);
    const result = computeForwardPass(tasks, order);
    const d = result.find((t) => t._id === 'D');
    expect(d.est).toBe(7);
    expect(d.eft).toBe(8);
  });

  test('Single task duration=5: EST=0, EFT=5', () => {
    const tasks = [makeTask('A', 5)];
    const order = topologicalSort(tasks);
    const result = computeForwardPass(tasks, order);
    expect(result[0].est).toBe(0);
    expect(result[0].eft).toBe(5);
  });
});

describe('Backward Pass', () => {
  test('Linear chain all critical', () => {
    const tasks = [
      makeTask('A', 2),
      makeTask('B', 3, ['A']),
      makeTask('C', 1, ['B']),
    ];
    const order = topologicalSort(tasks);
    const forward = computeForwardPass(tasks, order);
    const { adjList } = buildGraph(forward);
    const finals = forward.filter((t) => (adjList.get(t._id) || []).length === 0);
    const projectDuration = Math.max(...finals.map((t) => t.eft));
    const result = computeBackwardPass(forward, order, projectDuration);
    const map = Object.fromEntries(result.map((t) => [t._id, t]));
    expect(map.C.lft).toBe(6);
    expect(map.C.lst).toBe(5);
    expect(map.C.float).toBe(0);
    expect(map.C.isCritical).toBe(true);
    expect(map.B.isCritical).toBe(true);
    expect(map.A.isCritical).toBe(true);
  });

  test('Diamond B has float=2, C and D critical', () => {
    const tasks = [
      makeTask('A', 2),
      makeTask('B', 3, ['A']),
      makeTask('C', 5, ['A']),
      makeTask('D', 1, ['B', 'C']),
    ];
    const order = topologicalSort(tasks);
    const forward = computeForwardPass(tasks, order);
    const result = computeBackwardPass(forward, order, 8);
    const map = Object.fromEntries(result.map((t) => [t._id, t]));
    expect(map.B.float).toBe(2);
    expect(map.B.isCritical).toBe(false);
    expect(map.C.isCritical).toBe(true);
    expect(map.D.isCritical).toBe(true);
  });

  test('isCritical is true ONLY when float === 0', () => {
    const tasks = [
      makeTask('A', 2),
      makeTask('B', 3, ['A']),
      makeTask('C', 5, ['A']),
      makeTask('D', 1, ['B', 'C']),
    ];
    const { tasks: finalTasks } = runCPM(tasks);
    for (const t of finalTasks) {
      expect(t.isCritical).toBe(t.float === 0);
    }
  });
});

describe('Full CPM Integration', () => {
  test('5-task project critical path', () => {
    const tasks = [
      makeTask('A', 2),
      makeTask('B', 4, ['A']),
      makeTask('C', 1, ['A']),
      makeTask('D', 3, ['B']),
      makeTask('E', 2, ['C', 'D']),
    ];
    const result = runCPM(tasks);
    expect(result.criticalPath.length).toBeGreaterThan(0);
    expect(result.projectDuration).toBeGreaterThan(0);
  });

  test('Empty array returns empty result', () => {
    const result = runCPM([]);
    expect(result.tasks).toEqual([]);
    expect(result.projectDuration).toBe(0);
  });

  test('Circular dependency throws', () => {
    const tasks = [
      makeTask('A', 1, ['C']),
      makeTask('B', 1, ['A']),
      makeTask('C', 1, ['B']),
    ];
    expect(() => runCPM(tasks)).toThrow('Circular dependency detected');
  });
});

describe('Cascade Impact', () => {
  test('Delay critical path task shifts deadline', () => {
    const tasks = [
      makeTask('A', 2),
      makeTask('B', 3, ['A']),
      makeTask('C', 1, ['B']),
    ];
    const result = computeCascadeImpact(tasks, 'A', 3);
    expect(result.deadlineShift).toBe(3);
  });

  test('Delay non-critical task within float does not shift deadline', () => {
    const tasks = [
      makeTask('A', 2),
      makeTask('B', 3, ['A']),
      makeTask('C', 5, ['A']),
      makeTask('D', 1, ['B', 'C']),
    ];
    const cpm = runCPM(tasks);
    const bTask = cpm.tasks.find((t) => t._id === 'B');
    expect(bTask.float).toBeGreaterThan(0);
    const result = computeCascadeImpact(tasks, 'B', 2);
    expect(result.deadlineShift).toBe(0);
  });

  test('affectedTaskIds includes downstream not upstream', () => {
    const tasks = [
      makeTask('A', 2),
      makeTask('B', 3, ['A']),
      makeTask('C', 1, ['B']),
    ];
    const result = computeCascadeImpact(tasks, 'B', 1);
    expect(result.affectedTaskIds).toContain('B');
    expect(result.affectedTaskIds).toContain('C');
    expect(result.affectedTaskIds).not.toContain('A');
  });
});
