import { Request, Response, NextFunction } from 'express';
import { NotFoundException } from './error.middleware';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundException(`🔍 - Not Found - ${req.originalUrl}`));
};
