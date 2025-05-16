import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate-request.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { AuthController } from '../controllers/auth.controller';
import { DatabaseService } from '../services/database.service';
import { BaseRoute } from './base.route';

export class AuthRoutes extends BaseRoute {
  private authController: AuthController;

  constructor(private db: DatabaseService) {
    super();
    this.authController = new AuthController(db);
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    // Register route
    this.router.post(
      '/register',
      [
        body('email').isEmail().withMessage('Email must be valid'),
        body('password')
          .trim()
          .isLength({ min: 6, max: 20 })
          .withMessage('Password must be between 6 and 20 characters'),
        body('full_name').notEmpty().withMessage('Full name is required'),
      ],
      validateRequest,
      this.asyncHandler(this.authController.register)
    );

    // Login route
    this.router.post(
      '/login',
      [
        body('email').isEmail().withMessage('Email must be valid'),
        body('password').exists().withMessage('Password is required'),
      ],
      validateRequest,
      this.asyncHandler(this.authController.login)
    );

    // Get current user
    this.router.get(
      '/me',
      authMiddleware,
      this.asyncHandler(this.authController.getCurrentUser)
    );
  }
}

// Export a function that creates the router
export default (db: DatabaseService) => {
  return new AuthRoutes(db).router;
};
