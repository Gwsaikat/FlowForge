import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  aiAdvisor,
  aiStandup,
  aiSmartDeps,
  aiGhostPath,
  aiProjectGuard,
} from '../controllers/aiController.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(aiProjectGuard);

router.get('/:projectId/ai/advisor', aiAdvisor);
router.get('/:projectId/ai/standup', aiStandup);
router.get('/:projectId/ai/smart-dependencies', aiSmartDeps);
router.get('/:projectId/ai/ghost-path', aiGhostPath);

export default router;
