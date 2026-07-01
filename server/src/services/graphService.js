import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { runCPM } from '../algorithms/cpmEngine.js';
import { toAlgoTasks, buildGraph } from '../algorithms/graphUtils.js';
import { safeGet, safeSetex, safeDel } from '../config/redis.js';

/**
 * Calculate Deadline Pressure Score for a single task.
 */
export function calculateDPS(task, project, successorCount) {
  if (task.status === 'done') return 100;
  if (task.isCritical) return 0;

  const today = new Date();
  let timeRemaining = 30;
  if (project?.deadline) {
    timeRemaining = Math.max(
      1,
      (new Date(project.deadline) - today) / (1000 * 60 * 60 * 24)
    );
  }

  const floatRatio = task.float / timeRemaining;
  const dependencyFactor = 1 + successorCount * 0.1;
  const rawDPS = (floatRatio * 100) / dependencyFactor;
  return Math.max(0, Math.min(100, Math.round(rawDPS)));
}

/**
 * Update DPS for all tasks in a project.
 */
export async function updateAllDPS(projectId) {
  const project = await Project.findById(projectId);
  const tasks = await Task.find({ projectId }).lean();
  const algoTasks = toAlgoTasks(tasks);
  const { adjList } = buildGraph(algoTasks);

  const bulkOps = algoTasks.map((task) => {
    const successorCount = (adjList.get(String(task._id)) || []).length;
    const dps = calculateDPS(task, project, successorCount);
    return {
      updateOne: {
        filter: { _id: task._id },
        update: { $set: { dps } },
      },
    };
  });

  if (bulkOps.length > 0) {
    await Task.bulkWrite(bulkOps);
  }
}

/**
 * Invalidate CPM cache for a project.
 */
export async function invalidateCPMCache(projectId) {
  await safeDel(`cpm:${projectId}`);
}

/**
 * Invalidate task list cache.
 */
export async function invalidateTaskCache(projectId) {
  await safeDel(`tasks:${projectId}`);
}

/**
 * Invalidate graph health cache.
 */
export async function invalidateHealthCache(projectId) {
  await safeDel(`health:${projectId}`);
}

/**
 * Recalculate CPM values and persist to database.
 */
export async function recalculateGraph(projectId) {
  const cacheKey = `cpm:${projectId}`;
  const cached = await safeGet(cacheKey);
  if (cached) return JSON.parse(cached);

  const tasks = await Task.find({ projectId }).lean();
  const algoTasks = toAlgoTasks(tasks);

  let cpmResult;
  try {
    cpmResult = runCPM(algoTasks);
  } catch (err) {
    console.error('CPM recalculation failed:', err.message);
    return null;
  }

  const bulkOps = cpmResult.tasks.map((task) => ({
    updateOne: {
      filter: { _id: task._id },
      update: {
        $set: {
          est: task.est,
          eft: task.eft,
          lst: task.lst,
          lft: task.lft,
          float: task.float,
          isCritical: task.isCritical,
        },
      },
    },
  }));

  if (bulkOps.length > 0) {
    await Task.bulkWrite(bulkOps);
  }

  await Project.findByIdAndUpdate(projectId, {
    projectDuration: cpmResult.projectDuration,
    criticalPath: cpmResult.criticalPath,
  });

  await updateAllDPS(projectId);
  await safeSetex(cacheKey, 60, JSON.stringify(cpmResult));
  return cpmResult;
}

/**
 * Recalculate graph and notify connected clients via Socket.io.
 */
export async function recalculateAfterChange(projectId, io) {
  await invalidateCPMCache(projectId);
  await invalidateHealthCache(projectId);
  const result = await recalculateGraph(projectId);

  if (io) {
    io.to(`project:${projectId}`).emit('graph:updated', {
      projectId,
      updatedAt: new Date(),
    });
  }

  return result;
}
