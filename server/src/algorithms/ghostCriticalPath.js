import { runCPM } from './cpmEngine.js';
import { buildGraph } from './graphUtils.js';

/**
 * Predict tasks that will JOIN the critical path before project completes.
 * Simulates velocity drift inflation on each non-critical branch independently.
 * Unique to FlowForge — no PM tool does graph-aware ghost path prediction.
 */
export function predictGhostCriticalPath(tasks, driftMap = {}) {
  if (!tasks?.length) return { ghostTasks: [], shiftRisk: 0 };

  const normalized = tasks.map((t) => ({
    ...t,
    _id: String(t._id),
    dependencies: (t.dependencies || []).map(String),
  }));

  let baseline;
  try {
    baseline = runCPM(normalized);
  } catch {
    return { ghostTasks: [], shiftRisk: 0 };
  }

  const criticalSet = new Set(baseline.criticalPath.map(String));
  const ghostTasks = [];

  for (const task of baseline.tasks) {
    const id = String(task._id);
    if (criticalSet.has(id) || task.status === 'done') continue;

    const drift = driftMap[String(task.assignee)] || 1.0;
    const floatBuffer = task.float;

    // Simulate: what if this task runs at drift-adjusted duration?
    const inflated = normalized.map((t) =>
      String(t._id) === id ? { ...t, duration: t.duration * drift } : t
    );

    let simulated;
    try {
      simulated = runCPM(inflated);
    } catch {
      continue;
    }

    const simTask = simulated.tasks.find((t) => String(t._id) === id);
    const becomesCritical = simTask?.isCritical && !task.isCritical;
    const floatConsumed = task.float - (simTask?.float ?? task.float);
    const probability = Math.min(
      100,
      Math.round(
        (becomesCritical ? 70 : 0) +
          floatConsumed * 15 +
          (drift > 1.2 ? (drift - 1) * 40 : 0) +
          (task.dps < 40 ? 20 : 0)
      )
    );

    if (probability >= 35) {
      const { adjList } = buildGraph(normalized);
      const dependentCount = (adjList.get(id) || []).length;

      ghostTasks.push({
        taskId: id,
        title: task.title,
        probability,
        currentFloat: task.float,
        projectedFloat: simTask?.float ?? 0,
        becomesCritical,
        drift,
        dependentCount,
        daysUntilCritical: becomesCritical
          ? Math.max(0, Math.round(task.est))
          : Math.round(task.float / Math.max(drift, 1)),
        reason: becomesCritical
          ? `Velocity drift (${drift.toFixed(1)}x) pushes this onto the critical path`
          : `Only ${simTask?.float?.toFixed(1) ?? task.float}d slack remains after drift adjustment`,
      });
    }
  }

  ghostTasks.sort((a, b) => b.probability - a.probability);

  const shiftRisk = ghostTasks.length
    ? Math.round(ghostTasks.reduce((s, g) => s + g.probability, 0) / ghostTasks.length)
    : 0;

  return { ghostTasks, shiftRisk, currentCriticalPath: baseline.criticalPath };
}

/**
 * Detect implied dependencies from task title/description keywords.
 * Rule-based fallback when AI unavailable.
 */
export function detectImpliedDependencies(tasks) {
  const suggestions = [];
  const keywords = {
    deploy: ['build', 'test', 'staging', 'ci', 'api', 'backend'],
    test: ['build', 'implement', 'develop', 'code', 'api'],
    frontend: ['design', 'ui', 'mockup', 'wireframe', 'api'],
    auth: ['database', 'schema', 'user', 'backend', 'api'],
    design: ['research', 'requirements', 'planning'],
    staging: ['deploy', 'test', 'build'],
    production: ['staging', 'deploy', 'test'],
  };

  for (const task of tasks) {
    const title = (task.title + ' ' + (task.description || '')).toLowerCase();
    const existingDeps = new Set((task.dependencies || []).map(String));

    for (const other of tasks) {
      if (String(other._id) === String(task._id)) continue;
      if (existingDeps.has(String(other._id))) continue;

      const otherTitle = other.title.toLowerCase();
      let score = 0;
      let reason = '';

      for (const [trigger, deps] of Object.entries(keywords)) {
        if (title.includes(trigger)) {
          for (const dep of deps) {
            if (otherTitle.includes(dep)) {
              score += 30;
              reason = `"${task.title}" likely needs "${other.title}" first (${trigger}→${dep})`;
            }
          }
        }
      }

      // Sequential naming patterns: "Phase 2" depends on "Phase 1"
      const phaseMatch = title.match(/phase\s*(\d+)/i);
      const otherPhase = otherTitle.match(/phase\s*(\d+)/i);
      if (phaseMatch && otherPhase && Number(phaseMatch[1]) === Number(otherPhase[1]) + 1) {
        score += 80;
        reason = `Sequential phase dependency detected`;
      }

      if (score >= 30) {
        suggestions.push({
          fromTaskId: String(other._id),
          fromTitle: other.title,
          toTaskId: String(task._id),
          toTitle: task.title,
          confidence: Math.min(95, score),
          reason,
        });
      }
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}

/**
 * Rank tasks by slip probability using graph position + velocity + DPS.
 */
export function rankDelayProphet(tasks, driftMap = {}) {
  return tasks
    .filter((t) => t.status !== 'done')
    .map((task) => {
      const drift = driftMap[String(task.assignee)] || 1.0;
      const slipScore = Math.min(
        100,
        Math.round(
          (drift - 1) * 35 +
            (task.isCritical ? 30 : 0) +
            (100 - (task.dps ?? 100)) * 0.4 +
            (task.float < 1 ? 25 : task.float < 3 ? 10 : 0) +
            (task.status === 'blocked' || task.status === 'delayed' ? 40 : 0)
        )
      );

      return {
        taskId: String(task._id),
        title: task.title,
        slipProbability: slipScore,
        assignee: task.assignee,
        float: task.float,
        drift,
        urgency: slipScore >= 70 ? 'imminent' : slipScore >= 45 ? 'likely' : 'watch',
      };
    })
    .sort((a, b) => b.slipProbability - a.slipProbability)
    .slice(0, 5);
}
