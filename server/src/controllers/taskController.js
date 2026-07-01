import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { validationResult } from 'express-validator';
import { wouldCreateCycle } from '../algorithms/cycleDetection.js';
import { runCPM, computeCascadeImpact } from '../algorithms/cpmEngine.js';
import { toAlgoTasks } from '../algorithms/graphUtils.js';
import {
  recalculateAfterChange,
  invalidateTaskCache,
  invalidateHealthCache,
} from '../services/graphService.js';
import { updateUserDrift, getRealisticProjectDuration } from '../services/velocityService.js';
import { getHandoffReport } from '../services/handoffService.js';
import { safeGet, safeSetex } from '../config/redis.js';

/**
 * List all tasks for a project.
 */
export async function getProjectTasks(req, res, next) {
  try {
    const { projectId } = req.params;
    const cacheKey = `tasks:${projectId}`;
    const cached = await safeGet(cacheKey);
    if (cached) {
      return res.json({ success: true, data: { tasks: JSON.parse(cached) } });
    }

    const tasks = await Task.find({ projectId })
      .populate('assignee', 'name email')
      .sort({ createdAt: 1 });

    await safeSetex(cacheKey, 30, JSON.stringify(tasks));
    res.json({ success: true, data: { tasks } });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new task in a project.
 */
export async function createTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { projectId } = req.params;
    const { title, description, duration, assignee, dependencies = [] } = req.body;

    const existingTasks = await Task.find({ projectId }).lean();
    const tempId = '__new_task__';
    const withNewTask = [
      ...toAlgoTasks(existingTasks),
      { _id: tempId, title, duration, dependencies: [] },
    ];

    for (const depId of dependencies) {
      const { wouldCycle } = wouldCreateCycle(withNewTask, depId, tempId);
      if (wouldCycle) {
        return res.status(409).json({
          success: false,
          error: 'Adding this dependency would create a circular chain',
        });
      }
    }

    const task = await Task.create({
      projectId,
      title,
      description,
      duration,
      estimatedDuration: duration,
      assignee: assignee || null,
      dependencies,
    });

    const io = req.app.get('io');
    await invalidateTaskCache(projectId);
    await recalculateAfterChange(projectId, io);

    const populated = await Task.findById(task._id).populate('assignee', 'name email');
    res.status(201).json({ success: true, data: { task: populated } });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a single task by ID.
 */
export async function getTaskById(req, res, next) {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      projectId: req.params.projectId,
    })
      .populate('assignee', 'name email')
      .populate('dependencies', 'title');

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
}

/**
 * Update task fields.
 */
export async function updateTask(req, res, next) {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      projectId: req.params.projectId,
    });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const { title, description, duration, assignee } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (duration !== undefined) task.duration = duration;
    if (assignee !== undefined) task.assignee = assignee || null;
    await task.save();

    const io = req.app.get('io');
    await invalidateTaskCache(req.params.projectId);
    await recalculateAfterChange(req.params.projectId, io);

    const populated = await Task.findById(task._id).populate('assignee', 'name email');
    res.json({ success: true, data: { task: populated } });
  } catch (err) {
    next(err);
  }
}

/**
 * Update task status with cascade impact and handoff lag tracking.
 */
export async function updateTaskStatus(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const task = await Task.findOne({
      _id: req.params.taskId,
      projectId: req.params.projectId,
    });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const { status } = req.body;
    let cascadeResult = null;

    if (status === 'active' && !task.actualStart) {
      task.actualStart = new Date();
      const donePredecessors = await Task.find({
        _id: { $in: task.dependencies },
        status: 'done',
      });
      if (donePredecessors.length > 0) {
        const latestPredEnd = Math.max(
          ...donePredecessors.map((p) => p.actualEnd?.getTime() || 0)
        );
        task.handoffLag = (Date.now() - latestPredEnd) / (1000 * 60);
      }
    }

    if (status === 'done') {
      task.actualEnd = new Date();
      if (task.assignee && task.actualStart) {
        updateUserDrift(task.assignee).catch(console.error);
      }
    }

    if (status === 'blocked' || status === 'delayed') {
      const allTasks = await Task.find({ projectId: req.params.projectId }).lean();
      cascadeResult = computeCascadeImpact(toAlgoTasks(allTasks), task._id, 1);
    }

    task.status = status;
    await task.save();

    const io = req.app.get('io');
    await invalidateTaskCache(req.params.projectId);
    await recalculateAfterChange(req.params.projectId, io);

    if (cascadeResult && io) {
      io.to(`project:${req.params.projectId}`).emit('task:blocked', {
        taskId: task._id,
        cascadeResult,
      });
    }

    const populated = await Task.findById(task._id).populate('assignee', 'name email');
    res.json({ success: true, data: { task: populated, cascadeResult } });
  } catch (err) {
    next(err);
  }
}

/**
 * Add a dependency edge to a task.
 */
export async function addDependency(req, res, next) {
  try {
    const { dependsOnTaskId } = req.body;
    const task = await Task.findOne({
      _id: req.params.taskId,
      projectId: req.params.projectId,
    });
    const depTask = await Task.findOne({
      _id: dependsOnTaskId,
      projectId: req.params.projectId,
    });

    if (!task || !depTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const allTasks = await Task.find({ projectId: req.params.projectId }).lean();
    const { wouldCycle, cyclePath } = wouldCreateCycle(
      toAlgoTasks(allTasks),
      dependsOnTaskId,
      task._id
    );

    if (wouldCycle) {
      return res.status(409).json({
        success: false,
        error: 'Adding this dependency would create a circular chain',
        cyclePath,
      });
    }

    if (!task.dependencies.some((d) => String(d) === String(dependsOnTaskId))) {
      task.dependencies.push(dependsOnTaskId);
      await task.save();
    }

    const io = req.app.get('io');
    await invalidateTaskCache(req.params.projectId);
    await recalculateAfterChange(req.params.projectId, io);

    res.json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
}

/**
 * Remove a dependency from a task.
 */
export async function removeDependency(req, res, next) {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      projectId: req.params.projectId,
    });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    task.dependencies = task.dependencies.filter(
      (d) => String(d) !== req.params.depId
    );
    await task.save();

    const io = req.app.get('io');
    await invalidateTaskCache(req.params.projectId);
    await recalculateAfterChange(req.params.projectId, io);

    res.json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a task and clean up dependencies.
 */
export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      projectId: req.params.projectId,
    });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    await task.deleteOne();
    await Task.updateMany(
      { projectId: req.params.projectId },
      { $pull: { dependencies: task._id } }
    );

    const io = req.app.get('io');
    await invalidateTaskCache(req.params.projectId);
    await recalculateAfterChange(req.params.projectId, io);

    res.json({ success: true, data: { message: 'Task deleted' } });
  } catch (err) {
    next(err);
  }
}

/**
 * Run what-if sandbox simulation without persisting changes.
 */
export async function runSandbox(req, res, next) {
  try {
    const { taskOverrides = [] } = req.body;
    const tasks = await Task.find({ projectId: req.params.projectId }).lean();
    const algoTasks = toAlgoTasks(tasks);

    const original = runCPM(algoTasks);

    const modified = algoTasks.map((t) => {
      const override = taskOverrides.find((o) => String(o.taskId) === String(t._id));
      if (override) return { ...t, duration: override.duration };
      return t;
    });

    const simulated = runCPM(modified);

    const oldCritical = new Set(original.criticalPath.map(String));
    const newCritical = new Set(simulated.criticalPath.map(String));
    const newCriticalTasks = [...newCritical].filter((id) => !oldCritical.has(id));
    const freedCriticalTasks = [...oldCritical].filter((id) => !newCritical.has(id));

    res.json({
      success: true,
      data: {
        original: {
          projectDuration: original.projectDuration,
          criticalPath: original.criticalPath,
        },
        simulated: {
          projectDuration: simulated.projectDuration,
          criticalPath: simulated.criticalPath,
          tasks: simulated.tasks,
        },
        impact: {
          deadlineShift: simulated.projectDuration - original.projectDuration,
          criticalPathChanged: newCriticalTasks.length > 0 || freedCriticalTasks.length > 0,
          newCriticalTasks,
          freedCriticalTasks,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get realistic deadline based on team velocity drift.
 */
export async function getProjectDeadline(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId);
    const tasks = await Task.find({ projectId: req.params.projectId }).lean();
    const result = await getRealisticProjectDuration(tasks, project);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Get handoff lag report for a project.
 */
export async function getHandoffLagReport(req, res, next) {
  try {
    const report = await getHandoffReport(req.params.projectId);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}
