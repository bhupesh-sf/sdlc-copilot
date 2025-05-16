import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { BadRequestException } from './error.middleware';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      message: error.msg,
      field: error.param,
      value: error.value,
    }));
    
    throw new BadRequestException('Validation failed', errorMessages);
  }
  
  next();
};

export default validateRequest;
