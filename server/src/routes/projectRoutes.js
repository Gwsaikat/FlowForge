import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/authenticate.js';
import { checkProjectMember } from '../middleware/checkProjectMember.js';
import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectHealth,
  getParallelOpportunities,
} from '../controllers/projectController.js';

const router = Router();

router.use(authenticate);

router.get('/', getUserProjects);
router.post('/', [body('name').trim().notEmpty().withMessage('Name is required')], createProject);
router.get('/:projectId', getProjectById);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);
router.post('/:projectId/members', checkProjectMember, addMember);
router.delete('/:projectId/members/:userId', checkProjectMember, removeMember);
router.get('/:projectId/health', checkProjectMember, getProjectHealth);
router.get('/:projectId/opportunities', checkProjectMember, getParallelOpportunities);

export default router;
