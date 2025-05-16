import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validate-request.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { ProjectController } from '../controllers/project.controller';
import { DatabaseService } from '../services/database.service';
import { BaseRoute } from './base.route';

export class ProjectRoutes extends BaseRoute {
  private projectController: ProjectController;

  constructor(private db: DatabaseService) {
    super();
    this.projectController = new ProjectController(db);
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    // Apply auth middleware to all routes
    this.router.use(authMiddleware);

    // Create project
    this.router.post(
      '/',
      [
        body('name').trim().notEmpty().withMessage('Project name is required'),
        body('description').optional().isString(),
        body('jiraId').optional().isString(),
      ],
      validateRequest,
      this.asyncHandler(this.projectController.createProject)
    );

    // Get all projects for current user
    this.router.get(
      '/',
      this.asyncHandler(this.projectController.getProjects)
    );

    // Get project by ID
    this.router.get(
      '/:id',
      [
        param('id').isUUID().withMessage('Invalid project ID'),
      ],
      validateRequest,
      this.asyncHandler(this.projectController.getProjectById)
    );

    // Update project
    this.router.put(
      '/:id',
      [
        param('id').isUUID().withMessage('Invalid project ID'),
        body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
        body('description').optional().isString(),
        body('jiraId').optional().isString(),
      ],
      validateRequest,
      this.asyncHandler(this.projectController.updateProject)
    );

    // Delete project
    this.router.delete(
      '/:id',
      [
        param('id').isUUID().withMessage('Invalid project ID'),
      ],
      validateRequest,
      this.asyncHandler(this.projectController.deleteProject)
    );
  }
}

// Export a function that creates the router
export default (db: DatabaseService) => {
  return new ProjectRoutes(db).router;
};
