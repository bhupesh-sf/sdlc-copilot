import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { UserRepository } from '../repositories/user.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { DocumentRepository } from '../repositories/document.repository';
import { StoryRepository } from '../repositories/story.repository';
import { TestCaseRepository } from '../repositories/testCase.repository';

/**
 * DatabaseService provides a centralized interface for all database operations
 * through dedicated repositories for each entity type.
 */
export class DatabaseService {
  /**
   * Repository for user-related database operations
   */
  public readonly users: UserRepository;

  /**
   * Repository for project-related database operations
   */
  public readonly projects: ProjectRepository;

  /**
   * Repository for document-related database operations
   */
  public readonly documents: DocumentRepository;

  /**
   * Repository for story-related database operations
   */
  public readonly stories: StoryRepository;

  /**
   * Repository for test case-related database operations
   */
  public readonly testCases: TestCaseRepository;

  /**
   * Create a new DatabaseService instance
   * @param supabase The Supabase client instance
   */
  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.users = new UserRepository(supabase);
    this.projects = new ProjectRepository(supabase);
    this.documents = new DocumentRepository(supabase);
    this.stories = new StoryRepository(supabase);
    this.testCases = new TestCaseRepository(supabase);
  }

  /**
   * Execute a database transaction
   * @param callback Async function that contains the transaction logic
   * @returns The result of the transaction callback
   */
  async transaction<T>(callback: (client: SupabaseClient<Database>) => Promise<T>): Promise<T> {
    // Note: Supabase doesn't support transactions directly in the client
    // This is a placeholder for future implementation with a transaction-aware client
    const client = this.supabase;
    return callback(client);
  }

  // Add any database-level operations here
  async healthCheck(): Promise<boolean> {
    const { data, error } = await this.supabase.from('users').select('*').limit(1);
    return !error;
  }
}

// Singleton instance
export let databaseService: DatabaseService;

export function initializeDatabaseService(supabase: SupabaseClient<Database>) {
  databaseService = new DatabaseService(supabase);
  return databaseService;
}
