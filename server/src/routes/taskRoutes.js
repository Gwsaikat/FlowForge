import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/authenticate.js';
import { checkProjectMember } from '../middleware/checkProjectMember.js';
import { graphLimiter } from '../middleware/rateLimiter.js';
import {
  getProjectTasks,
  createTask,
  getTaskById,
  updateTask,
  updateTaskStatus,
  addDependency,
  removeDependency,
  deleteTask,
  runSandbox,
  getProjectDeadline,
  getHandoffLagReport,
} from '../controllers/taskController.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:projectId/tasks', checkProjectMember, getProjectTasks);
router.post(
  '/:projectId/tasks',
  checkProjectMember,
  graphLimiter,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('duration').isFloat({ min: 0.5 }).withMessage('Duration must be at least 0.5 days'),
  ],
  createTask
);
router.get('/:projectId/tasks/:taskId', checkProjectMember, getTaskById);
router.put('/:projectId/tasks/:taskId', checkProjectMember, graphLimiter, updateTask);
router.patch(
  '/:projectId/tasks/:taskId/status',
  checkProjectMember,
  graphLimiter,
  [body('status').isIn(['pending', 'active', 'blocked', 'delayed', 'done']).withMessage('Invalid status')],
  updateTaskStatus
);
router.post('/:projectId/tasks/:taskId/dependencies', checkProjectMember, graphLimiter, addDependency);
router.delete(
  '/:projectId/tasks/:taskId/dependencies/:depId',
  checkProjectMember,
  graphLimiter,
  removeDependency
);
router.delete('/:projectId/tasks/:taskId', checkProjectMember, graphLimiter, deleteTask);
router.post('/:projectId/sandbox', checkProjectMember, runSandbox);
router.get('/:projectId/deadline', checkProjectMember, getProjectDeadline);
router.get('/:projectId/handoff-report', checkProjectMember, getHandoffLagReport);

export default router;
