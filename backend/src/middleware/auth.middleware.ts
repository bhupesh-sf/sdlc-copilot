import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { UnauthorizedException } from './error.middleware';

export interface AuthRequest extends Request {
  user?: any; // You can replace 'any' with a more specific user type
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('No token, authorization denied');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    
    // Add user from payload
    req.user = { id: decoded.userId };
    
    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      next(new UnauthorizedException('Token expired'));
    } else if (error instanceof Error && error.name === 'JsonWebTokenError') {
      next(new UnauthorizedException('Invalid token'));
    } else {
      next(error);
    }
  }
};

// Alias for authMiddleware
export const authenticate = authMiddleware;

// Role-based access control middleware
export const authorize = (roles: string[] = []) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }

      if (roles.length && !roles.includes(req.user.role)) {
        throw new UnauthorizedException('Not authorized to access this route');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
