import { Request, Response } from 'express';
import { TestCaseService } from '../services/testcase.service';
import { CreateTestCaseInput, UpdateTestCaseInput } from '../types/testcase.types';
import { body, param } from 'express-validator';

export class TestCaseController {
  constructor(private testCaseService: TestCaseService) {}

  // Validation rules
  createTestCaseValidation = [
    body('storyId').isUUID().withMessage('Valid story ID is required'),
    body('title').isString().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').isString().withMessage('Description is required'),
    body('steps').isArray().withMessage('Steps must be an array'),
    body('steps.*.action').isString().withMessage('Step action is required'),
    body('steps.*.expected').isString().withMessage('Step expected result is required'),
    body('expectedResult').isString().withMessage('Expected result is required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
  ];

  updateTestCaseValidation = [
    param('id').isUUID().withMessage('Valid test case ID is required'),
    body('title').optional().isString().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('steps').optional().isArray().withMessage('Steps must be an array'),
    body('steps.*.action').optional().isString().withMessage('Step action must be a string'),
    body('steps.*.expected').optional().isString().withMessage('Step expected result must be a string'),
    body('expectedResult').optional().isString().withMessage('Expected result must be a string'),
    body('status').optional().isIn(['draft', 'ready_for_review', 'in_review', 'approved', 'in_progress', 'done']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
  ];

  updateStatusValidation = [
    param('id').isUUID().withMessage('Valid test case ID is required'),
    body('status').isIn(['draft', 'ready_for_review', 'in_review', 'approved', 'in_progress', 'done']).withMessage('Invalid status')
  ];

  generateTestCasesValidation = [
    param('storyId').isUUID().withMessage('Valid story ID is required'),
    body('content').isObject().withMessage('Content object is required'),
    body('content.title').isString().withMessage('Story title is required'),
    body('content.description').isString().withMessage('Story description is required'),
    body('content.acceptanceCriteria').isArray().withMessage('Acceptance criteria must be an array'),
    body('content.projectDocuments').optional().isArray().withMessage('Project documents must be an array')
  ];

  createTestCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const input: CreateTestCaseInput = req.body;
      const testCase = await this.testCaseService.createTestCase(input, userId);
      res.status(201).json(testCase);
    } catch (error) {
      console.error('Error creating test case:', error);
      res.status(500).json({ error: 'Failed to create test case' });
    }
  };

  getTestCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const testCase = await this.testCaseService.getTestCaseById(id);
      
      if (!testCase) {
        res.status(404).json({ error: 'Test case not found' });
        return;
      }
      
      res.json(testCase);
    } catch (error) {
      console.error('Error fetching test case:', error);
      res.status(500).json({ error: 'Failed to fetch test case' });
    }
  };

  getTestCasesByStory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { storyId } = req.params;
      const testCases = await this.testCaseService.getTestCasesByStory(storyId);
      res.json(testCases);
    } catch (error) {
      console.error('Error fetching test cases:', error);
      res.status(500).json({ error: 'Failed to fetch test cases' });
    }
  };

  updateTestCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const updates: UpdateTestCaseInput = req.body;
      const updated = await this.testCaseService.updateTestCase(id, updates, userId);
      
      if (!updated) {
        res.status(404).json({ error: 'Test case not found' });
        return;
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating test case:', error);
      res.status(500).json({ error: 'Failed to update test case' });
    }
  };

  deleteTestCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.testCaseService.deleteTestCase(id);
      
      if (!success) {
        res.status(404).json({ error: 'Test case not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting test case:', error);
      res.status(500).json({ error: 'Failed to delete test case' });
    }
  };

  generateTestCases = async (req: Request, res: Response): Promise<void> => {
    try {
      const { storyId } = req.params;
      const { content } = req.body;
      
      if (!content) {
        res.status(400).json({ error: 'Story content is required' });
        return;
      }
      
      const testCases = await this.testCaseService.generateTestCasesFromStory(storyId, content);
      res.json(testCases);
    } catch (error) {
      console.error('Error generating test cases:', error);
      res.status(500).json({ error: 'Failed to generate test cases' });
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
      }
      
      const updated = await this.testCaseService.updateStatus(id, status, userId);
      
      if (!updated) {
        res.status(404).json({ error: 'Test case not found' });
        return;
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating test case status:', error);
      res.status(500).json({ error: 'Failed to update test case status' });
    }
  };

  // New endpoint to get workflow status
  getWorkflowStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const status = await this.testCaseService.getWorkflowStatus(id);
      
      if (status === null) {
        res.status(404).json({ error: 'Workflow not found for this test case' });
        return;
      }
      
      res.json({ status });
    } catch (error) {
      console.error('Error fetching workflow status:', error);
      res.status(500).json({ error: 'Failed to fetch workflow status' });
    }
  };
}

export default TestCaseController;
