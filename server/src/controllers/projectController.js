import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { detectDependencySmells } from '../algorithms/smellDetector.js';
import { findParallelOpportunities } from '../algorithms/parallelFinder.js';
import { safeGet, safeSetex } from '../config/redis.js';
import { toAlgoTasks } from '../algorithms/graphUtils.js';

/**
 * Create a new project owned by the current user.
 */
export async function createProject(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { name, description, deadline } = req.body;
    const project = await Project.create({
      name,
      description,
      deadline,
      owner: req.user.id,
      members: [req.user.id],
    });

    res.status(201).json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
}

/**
 * List all projects the user is a member of.
 */
export async function getUserProjects(req, res, next) {
  try {
    const projects = await Project.find({ members: req.user.id })
      .populate('owner', 'name email')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: { projects } });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a single project by ID.
 */
export async function getProjectById(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .populate('criticalPath', 'title');

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const isMember = project.members.some((m) => String(m._id || m) === String(req.user.id));
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
}

/**
 * Update project details (owner only).
 */
export async function updateProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    if (String(project.owner) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Only owner can update project' });
    }

    const { name, description, deadline, status } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (deadline !== undefined) project.deadline = deadline;
    if (status !== undefined) project.status = status;
    await project.save();

    res.json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete project and all associated tasks (owner only).
 */
export async function deleteProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    if (String(project.owner) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Only owner can delete project' });
    }

    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();
    res.json({ success: true, data: { message: 'Project deleted' } });
  } catch (err) {
    next(err);
  }
}

/**
 * Add a member to the project by email (owner only).
 */
export async function addMember(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    if (String(project.owner) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Only owner can add members' });
    }

    const user = await User.findByEmail(req.body.email);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (project.members.some((m) => String(m) === String(user._id))) {
      return res.status(409).json({ success: false, error: 'User is already a member' });
    }

    project.members.push(user._id);
    await project.save();
    await project.populate('members', 'name email');

    res.json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
}

/**
 * Remove a member from the project (owner only).
 */
export async function removeMember(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    if (String(project.owner) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Only owner can remove members' });
    }
    if (String(project.owner) === req.params.userId) {
      return res.status(400).json({ success: false, error: 'Cannot remove project owner' });
    }

    project.members = project.members.filter((m) => String(m) !== req.params.userId);
    await project.save();
    res.json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
}

/**
 * Get graph health report for a project.
 */
export async function getProjectHealth(req, res, next) {
  try {
    const cacheKey = `health:${req.params.projectId}`;
    const cached = await safeGet(cacheKey);
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached) });
    }

    const tasks = await Task.find({ projectId: req.params.projectId }).lean();
    const report = detectDependencySmells(toAlgoTasks(tasks));
    await safeSetex(cacheKey, 300, JSON.stringify(report));
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

/**
 * Get parallel opportunity analysis for a project.
 */
export async function getParallelOpportunities(req, res, next) {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId }).lean();
    const opportunities = findParallelOpportunities(toAlgoTasks(tasks));
    res.json({ success: true, data: { opportunities } });
  } catch (err) {
    next(err);
  }
}
