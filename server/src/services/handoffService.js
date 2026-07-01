import Task from '../models/Task.js';

/**
 * Generate handoff lag report for a project.
 */
export async function getHandoffReport(projectId) {
  const tasks = await Task.find({
    projectId,
    handoffLag: { $gt: 0 },
  })
    .populate('dependencies', 'title')
    .sort({ handoffLag: -1 })
    .lean();

  const totalLagMinutes = tasks.reduce((sum, t) => sum + t.handoffLag, 0);
  const totalLagHours = totalLagMinutes / 60;
  const totalLagDays = totalLagHours / 8;
  const avgLagHours = tasks.length > 0 ? totalLagHours / tasks.length : 0;

  const worstHandoffs = tasks.slice(0, 3).map((t) => ({
    taskId: t._id,
    title: t.title,
    lagHours: (t.handoffLag / 60).toFixed(1),
    predecessorTitle: t.dependencies?.[0]?.title || 'Unknown',
  }));

  const lateHandoffs = tasks.filter((t) => t.handoffLag > 240);

  return {
    totalLagHours: totalLagHours.toFixed(1),
    totalLagDays: totalLagDays.toFixed(1),
    avgLagHours: avgLagHours.toFixed(1),
    worstHandoffs,
    lateHandoffs: lateHandoffs.length,
    handoffCount: tasks.length,
  };
}
