import { Router, Request, Response, NextFunction } from 'express';
import { HttpException } from '../middleware/error.middleware';

export class BaseRoute {
  public router: Router;
  protected controller: any; // Replace 'any' with your controller type

  constructor(controller?: any) {
    this.router = Router();
    this.controller = controller;
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    // To be implemented by child classes
  }

  // Common error handler for async route handlers
  protected asyncHandler = (fn: Function) => 
    (req: Request, res: Response, next: NextFunction): Promise<void> => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };

  // Common success response
  protected success(res: Response, data: any, statusCode = 200): void {
    res.status(statusCode).json({
      success: true,
      data
    });
  }

  // Common error response
  protected error(res: Response, error: Error | HttpException): void {
    const statusCode = 'status' in error ? error.status : 500;
    const message = error.message || 'Internal Server Error';
    
    res.status(statusCode).json({
      success: false,
      error: message
    });
  }
}

export default BaseRoute;
