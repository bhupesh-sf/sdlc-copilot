import { Router } from 'express';
import { TestCaseController } from '../controllers/testcase.controller';
import { TestCaseService } from '../services/testcase.service';
import { TestCaseRepository } from '../repositories/testCase.repository';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { supabase } from '../lib/supabase';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate-request.middleware';

// Helper to wrap async route handlers
type AsyncRequestHandler = (
  req: any,
  res: any,
  next: any
) => Promise<any>;

const asyncHandler = (fn: AsyncRequestHandler) => 
  (req: any, res: any, next: any) => 
    Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();
const testCaseRepo = new TestCaseRepository(supabase);
const workflowRepo = new WorkflowRepository();
const testCaseService = new TestCaseService(testCaseRepo, workflowRepo);
const testCaseController = new TestCaseController(testCaseService);

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new test case
router.post(
  '/',
  testCaseController.createTestCaseValidation,
  validateRequest,
  asyncHandler(async (req, res) => {
    await testCaseController.createTestCase(req, res);
  })
);

// Get test case by ID
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    await testCaseController.getTestCase(req, res);
  })
);

// Get test cases by story ID
router.get(
  '/story/:storyId',
  asyncHandler(async (req, res) => {
    await testCaseController.getTestCasesByStory(req, res);
  })
);

// Update test case
router.patch(
  '/:id',
  testCaseController.updateTestCaseValidation,
  validateRequest,
  asyncHandler(async (req, res) => {
    await testCaseController.updateTestCase(req, res);
  })
);

// Delete test case
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await testCaseController.deleteTestCase(req, res);
  })
);

// Generate test cases from story content
router.post(
  '/generate/:storyId',
  testCaseController.generateTestCasesValidation,
  validateRequest,
  asyncHandler(async (req, res) => {
    await testCaseController.generateTestCases(req, res);
  })
);

// Update test case status
router.patch(
  '/:id/status',
  testCaseController.updateStatusValidation,
  validateRequest,
  asyncHandler(async (req, res) => {
    await testCaseController.updateStatus(req, res);
  })
);

// Get workflow status for a test case
router.get(
  '/:id/workflow',
  asyncHandler(async (req, res) => {
    await testCaseController.getWorkflowStatus(req, res);
  })
);

export default router;
