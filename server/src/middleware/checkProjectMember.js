import Project from '../models/Project.js';

/**
 * Ensure the authenticated user is a member of the project.
 */
export async function checkProjectMember(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    const isMember = project.members.some((m) => String(m) === String(req.user.id));
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    req.project = project;
    next();
  } catch (err) {
    next(err);
  }
}
