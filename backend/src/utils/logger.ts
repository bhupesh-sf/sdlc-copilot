import winston from 'winston';
import { config } from '../config/config';

const { combine, timestamp, printf, colorize, align, errors } = winston.format;

interface TransformableInfo {
  level: string;
  message: string;
  [key: string]: any;
}

const logFormat = printf(({ level, message: msg, timestamp: time, stack }: TransformableInfo) => {
  const message = typeof msg === 'string' ? msg : JSON.stringify(msg);
  return `${time} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    align(),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ],
  exitOnError: false
});

// Create a stream for morban
interface LoggerStream {
  write: (message: string) => void;
}

const stream: LoggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export { logger, stream };
