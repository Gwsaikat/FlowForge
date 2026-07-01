import Project from '../models/Project.js';
import {
  getProjectAdvisor,
  generateStandupBrief,
  getSmartDependencies,
  getGhostCriticalPathAnalysis,
} from '../services/aiService.js';

async function getProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    const isMember = project.members.some((m) => String(m) === String(req.user.id));
    if (!isMember) return res.status(403).json({ success: false, error: 'Access denied' });
    req.projectDoc = project;
    next();
  } catch (err) {
    next(err);
  }
}

export async function aiAdvisor(req, res, next) {
  try {
    const data = await getProjectAdvisor(req.params.projectId, req.projectDoc);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function aiStandup(req, res, next) {
  try {
    const data = await generateStandupBrief(req.params.projectId, req.projectDoc);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function aiSmartDeps(req, res, next) {
  try {
    const data = await getSmartDependencies(req.params.projectId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function aiGhostPath(req, res, next) {
  try {
    const data = await getGhostCriticalPathAnalysis(req.params.projectId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export { getProject as aiProjectGuard };
