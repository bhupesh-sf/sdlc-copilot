import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './config/config';
import { logger, stream } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { prismaService } from './services/prisma.service';

// Import and initialize routes
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import documentRoutes from './routes/document.routes';
import storyRoutes from './routes/story.routes';
import workflowRouter from './routes/workflow.routes';
import testCaseRouter from './routes/testcase.routes';
import jiraRouter from './routes/jira.routes';

const authRouter = authRoutes(dbService);
const projectRouter = projectRoutes(dbService);
const documentRouter = documentRoutes(dbService);
const storyRouter = storyRoutes(dbService);
const testCaseRoutes = testCaseRouter;
const jiraRoutes = jiraRouter;

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security headers
    this.app.use(helmet());
    
    // Enable CORS
    this.app.use(cors({
      origin: config.corsOrigin,
      credentials: true,
    }));

    // Request logging
    this.app.use(morgan('combined', { stream }));
    
    // Parse JSON bodies
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Compression
    this.app.use(compression());
    
    // Rate limiting
    this.app.use(rateLimiter);
  }


  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get(`${config.apiPrefix}/health`, (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use('/api/auth', authRouter);
    this.app.use('/api/projects', projectRouter);
    this.app.use('/api/documents', documentRouter);
    this.app.use('/api/stories', storyRouter);
    this.app.use('/api/workflow', workflowRouter);
    this.app.use('/api/test-cases', testCaseRoutes);
    this.app.use('/api/jira', jiraRoutes);

    // 404 handler
    this.app.use(notFoundHandler);
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler);
  }
}

export const app = new App().app;
