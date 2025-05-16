import { Router, Request, Response, NextFunction } from 'express';
import { jiraController } from '../controllers/jira.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Helper to wrap async route handlers
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => 
  (req: Request, res: Response, next: NextFunction) => 
    Promise.resolve(fn(req, res, next)).catch(next);

// Middleware to check JIRA config
const checkJiraConfig = (req: Request, res: Response, next: NextFunction) => {
  if (!jiraController.jiraService) {
    res.status(400).json({ error: 'JIRA configuration is missing' });
    return;
  }
  next();
};

// Configure JIRA credentials
router.post(
  '/configure',
  asyncHandler(async (req, res) => {
    await jiraController.configureJira(req, res);
  })
);

// Sync test case to JIRA
router.post(
  '/test-cases/:testCaseId/sync',
  checkJiraConfig,
  asyncHandler(async (req, res) => {
    await jiraController.syncTestCase(req, res);
  })
);

// Get JIRA issue by key
router.get(
  '/issues/:issueKey',
  checkJiraConfig,
  asyncHandler(async (req, res) => {
    await jiraController.getIssue(req, res);
  })
);

// Search JIRA issues
router.get(
  '/search',
  checkJiraConfig,
  asyncHandler(async (req, res) => {
    await jiraController.searchIssues(req, res);
  })
);

// Add comment to JIRA issue
router.post(
  '/issues/:issueKey/comment',
  checkJiraConfig,
  asyncHandler(async (req, res) => {
    await jiraController.addComment(req, res);
  })
);

export default router;
