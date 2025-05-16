import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

// Add pgvector extension support
declare module '@prisma/client' {
  interface PrismaClient {
    $queryRaw<T = any>(query: TemplateStringsArray, ...values: any[]): Promise<T[]>;
    $executeRaw<T = any>(query: TemplateStringsArray, ...values: any[]): Promise<number>;
  }
}

class PrismaService {
  public prisma: PrismaClient;
  private static instance: PrismaService;

  private constructor() {
    this.prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });

    // Logging for development
    if (process.env.NODE_ENV === 'development') {
      this.prisma.$on('query', (e) => {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Params: ${e.params}`);
        logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // Handle process termination
    process.on('beforeExit', async () => {
      await this.prisma.$disconnect();
    });
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  // Add custom methods for your application here
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }

  // Example of a custom raw query method for vector search
  async vectorSearch(embedding: number[], limit = 10, threshold = 0.7) {
    return this.prisma.$queryRaw`
      SELECT id, content, metadata, 
            1 - (embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
      FROM documents
      WHERE 1 - (embedding <=> ${JSON.stringify(embedding)}::vector) > ${threshold}
      ORDER BY similarity DESC
      LIMIT ${limit};
    `;
  }
}

export const prismaService = PrismaService.getInstance();
export type { Prisma };
