import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface HttpException extends Error {
  status?: number;
  statusCode?: number;
  message: string;
  errors?: any[];
}

export const errorHandler = (
  error: HttpException,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const status = error.status || error.statusCode || 500;
    const message = error.message || 'Something went wrong';
    const errors = error.errors || [];

    logger.error(
      `[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`,
      error.stack
    );

    res.status(status).json({
      success: false,
      message,
      errors,
      stack: process.env.NODE_ENV === 'development' ? error.stack : {},
    });
  } catch (error) {
    next(error);
  }
};

export class HttpException extends Error {
  status: number;
  message: string;
  errors?: any[];

  constructor(status: number, message: string, errors?: any[]) {
    super(message);
    this.status = status;
    this.message = message;
    this.errors = errors || [];
  }
}

export class BadRequestException extends HttpException {
  constructor(message = 'Bad Request', errors?: any[]) {
    super(400, message, errors);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized', errors?: any[]) {
    super(401, message, errors);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden', errors?: any[]) {
    super(403, message, errors);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Not Found', errors?: any[]) {
    super(404, message, errors);
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'Conflict', errors?: any[]) {
    super(409, message, errors);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message = 'Internal Server Error', errors?: any[]) {
    super(500, message, errors);
  }
}
