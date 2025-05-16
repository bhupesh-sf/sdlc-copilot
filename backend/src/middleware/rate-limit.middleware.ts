import rateLimit from 'express-rate-limit';
import { config } from '../config/config';
import { logger } from '../utils/logger';

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes',
  handler: (req: any, res: any, next: any, options: any) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
  skip: (req: any) => {
    // Skip rate limiting for health checks
    return req.path === `${config.apiPrefix}/health`;
  }
};

export const rateLimiter = rateLimit(rateLimitConfig);
