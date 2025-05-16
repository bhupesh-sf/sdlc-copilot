import 'reflect-metadata';
import { config } from './config/config';
import { createServer } from 'http';
import { app } from './app';
import { logger } from './utils/logger';

// Create HTTP server
const server = createServer(app);
const port = config.port;

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  
  // Close the server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force close server after 5 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
server.listen(port, () => {
  logger.info(`Server is running on port ${port} in ${config.nodeEnv} mode`);
});

export { server };
