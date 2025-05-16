import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { WorkflowController } from '../controllers/workflow.controller';
import { authenticate } from '../middleware/auth.middleware';

// Helper to wrap async route handlers
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => 
  (req: Request, res: Response, next: NextFunction) => 
    Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();
const workflowController = new WorkflowController();

// Protected routes
router.use(authenticate);

// Start a new workflow
router.post(
  '/project/:projectId/start',
  authenticate,
  asyncHandler(async (req, res) => {
    await workflowController.startWorkflow(req, res);
  })
);

// Get workflow status
router.get(
  '/:workflowId',
  authenticate,
  asyncHandler(async (req, res) => {
    await workflowController.getWorkflow(req, res);
  })
);

// Update workflow step
router.patch(
  '/:workflowId',
  authenticate,
  asyncHandler(async (req, res) => {
    await workflowController.updateWorkflow(req, res);
  })
);

export default router;
