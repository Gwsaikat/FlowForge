import Task from '../models/Task.js';
import User from '../models/User.js';
import { runCPM } from '../algorithms/cpmEngine.js';
import { toAlgoTasks } from '../algorithms/graphUtils.js';

/**
 * Calculate velocity drift coefficient from completed task history.
 */
export async function calculateDriftCoefficient(userId) {
  const tasks = await Task.find({
    assignee: userId,
    status: 'done',
    actualStart: { $ne: null },
    actualEnd: { $ne: null },
  })
    .sort({ actualEnd: -1 })
    .limit(10)
    .lean();

  if (tasks.length < 3) return 1.0;

  const ratios = tasks.map((task) => {
    const actualDays =
      (new Date(task.actualEnd) - new Date(task.actualStart)) / (1000 * 60 * 60 * 24);
    const estimated = task.estimatedDuration || task.duration;
    return actualDays / estimated;
  });

  const average = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  return Math.max(0.3, Math.min(3.0, average));
}

/**
 * Update user's velocity drift in the database.
 */
export async function updateUserDrift(userId) {
  if (!userId) return 1.0;
  const drift = await calculateDriftCoefficient(userId);
  await User.findByIdAndUpdate(userId, { velocityDrift: drift });
  return drift;
}

/**
 * Compare optimistic vs drift-adjusted project duration.
 */
export async function getRealisticProjectDuration(tasks, project) {
  const algoTasks = toAlgoTasks(tasks);
  const optimistic = runCPM(algoTasks);

  const assigneeIds = [...new Set(algoTasks.map((t) => t.assignee).filter(Boolean))];
  const users = await User.find({ _id: { $in: assigneeIds } }).lean();
  const driftMap = new Map(users.map((u) => [String(u._id), u.velocityDrift || 1.0]));

  const adjustedTasks = algoTasks.map((t) => ({
    ...t,
    duration: t.duration * (driftMap.get(String(t.assignee)) || 1.0),
  }));

  const realistic = runCPM(adjustedTasks);

  const startDate = project?.createdAt || new Date();
  const optimisticDeadline = new Date(startDate);
  optimisticDeadline.setDate(optimisticDeadline.getDate() + optimistic.projectDuration);

  const realisticDeadline = new Date(startDate);
  realisticDeadline.setDate(realisticDeadline.getDate() + realistic.projectDuration);

  const assigneeDrifts = users.map((u) => ({
    userId: u._id,
    name: u.name,
    drift: u.velocityDrift || 1.0,
  }));

  return {
    optimisticDuration: optimistic.projectDuration,
    realisticDuration: realistic.projectDuration,
    optimisticDeadline,
    realisticDeadline,
    assigneeDrifts,
  };
}
