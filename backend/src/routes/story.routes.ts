import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validate-request.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { StoryController } from '../controllers/story.controller';
import { DatabaseService } from '../services/database.service';
import { BaseRoute } from './base.route';

export class StoryRoutes extends BaseRoute {
  private storyController: StoryController;

  constructor(private db: DatabaseService) {
    super();
    this.storyController = new StoryController(db);
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    // Apply auth middleware to all routes
    this.router.use(authMiddleware);

    // Create a new story
    this.router.post(
      '/projects/:projectId/stories',
      [
        param('projectId').isUUID().withMessage('Invalid project ID'),
        body('title').isString().notEmpty().withMessage('Title is required'),
        body('description').isString().notEmpty().withMessage('Description is required'),
        body('businessValue').optional().isString(),
        body('acceptanceCriteria')
          .isArray({ min: 1 })
          .withMessage('At least one acceptance criterion is required'),
        body('documentIds').optional().isArray(),
        body('documentIds.*').isUUID().withMessage('Invalid document ID'),
      ],
      validateRequest,
      this.asyncHandler(this.storyController.createStory)
    );

    // Get story workflow status
    this.router.get(
      '/stories/:storyId/status',
      [
        param('storyId').isUUID().withMessage('Invalid story ID'),
      ],
      validateRequest,
      this.asyncHandler(this.storyController.getStoryWorkflowStatus)
    );

    // Continue story workflow
    this.router.post(
      '/stories/:storyId/continue',
      [
        param('storyId').isUUID().withMessage('Invalid story ID'),
        body('action').isString().notEmpty().withMessage('Action is required'),
        body('input').optional(),
      ],
      validateRequest,
      this.asyncHandler(this.storyController.continueStoryWorkflow)
    );

    // Generate test cases for a story
    this.router.post(
      '/stories/:storyId/test-cases/generate',
      [
        param('storyId').isUUID().withMessage('Invalid story ID'),
      ],
      validateRequest,
      this.asyncHandler(this.storyController.generateTestCases)
    );

    // Get test cases for a story
    this.router.get(
      '/stories/:storyId/test-cases',
      [
        param('storyId').isUUID().withMessage('Invalid story ID'),
      ],
      validateRequest,
      this.asyncHandler(this.storyController.getTestCases)
    );

    // Sync story with JIRA
    this.router.post(
      '/stories/:storyId/sync-jira',
      [
        param('storyId').isUUID().withMessage('Invalid story ID'),
        body('jiraToken').isString().notEmpty().withMessage('JIRA token is required'),
        body('jiraUrl').isURL().withMessage('Valid JIRA URL is required'),
      ],
      validateRequest,
      this.asyncHandler(this.storyController.syncWithJira)
    );
  }
}

// Export a function that creates the router
export default (db: DatabaseService) => {
  return new StoryRoutes(db).router;
};
