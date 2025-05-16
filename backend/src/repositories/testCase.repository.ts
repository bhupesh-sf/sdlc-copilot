import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { BaseRepository } from './base.repository';
import { 
  TestCase, 
  TestCaseStatus, 
  TestCasePriority, 
  TestStep, 
  CreateTestCaseInput, 
  UpdateTestCaseInput 
} from '../types/testcase.types';
import { v4 as uuidv4 } from 'uuid';

// Database row types
export type TestCaseRow = Database['public']['Tables']['test_cases']['Row'];

// Types for database operations
type TestCaseInsert = Omit<Database['public']['Tables']['test_cases']['Insert'], 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

type TestCaseUpdate = Omit<
  Database['public']['Tables']['test_cases']['Update'], 
  'id' | 'created_at' | 'created_by' | 'updated_at'
> & {
  updated_at?: string;
};

// Application types
type CreateTestCase = Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateTestCase = Partial<Omit<CreateTestCase, 'storyId' | 'createdBy'>>;

export class TestCaseRepository extends BaseRepository<TestCaseRow> {
  protected readonly tableName = 'test_cases' as const;
  protected readonly defaultSelect = `
    id,
    story_id,
    title,
    description,
    steps,
    expected_result,
    status,
    priority,
    jira_id,
    preconditions,
    postconditions,
    created_by,
    created_at,
    updated_at
  `;

  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'test_cases');
  }

  /**
   * Convert a database row to a TestCase
   * @param dbCase The database row
   * @returns The TestCase object
   */
  private toTestCase(dbCase: TestCaseRow): TestCase {
    return {
      id: dbCase.id,
      storyId: dbCase.story_id,
      title: dbCase.title,
      description: dbCase.description,
      steps: dbCase.steps,
      expectedResult: dbCase.expected_result,
      status: dbCase.status as TestCaseStatus,
      priority: dbCase.priority as TestCasePriority,
      jiraId: dbCase.jira_id || null,
      preconditions: dbCase.preconditions || null,
      postconditions: dbCase.postconditions || null,
      createdBy: dbCase.created_by,
      createdAt: dbCase.created_at,
      updatedAt: dbCase.updated_at,
    };
  }

  /**
   * Find all test cases for a specific story
   * @param storyId The ID of the story
   * @param status Optional status filter
   * @returns Array of test cases
   */
  async findByStory(storyId: string, status?: TestCaseStatus): Promise<TestCase[]> {
    const filters: Record<string, unknown> = { story_id: storyId };
    if (status) {
      filters.status = status;
    }
    
    const testCases = await this.findAll(filters as any);
    return testCases.map(tc => this.toTestCase(tc));
  }

  /**
   * Find test cases by JIRA ID
   * @param jiraId The JIRA issue ID
   * @returns Array of matching test cases
   */
  async findByJiraId(jiraId: string): Promise<TestCase[]> {
    const testCases = await this.findAll({ jira_id: jiraId } as any);
    return testCases.map(tc => this.toTestCase(tc));
  }

  /**
   * Create a new test case
   * @param testCase The test case data
   * @returns The created test case row from the database
   */
  async create(data: TestCaseInsert): Promise<TestCaseRow> {
    const now = new Date().toISOString();
    const testCase = {
      ...data,
      id: data.id || uuidv4(),
      created_at: now,
      updated_at: now,
    };

    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert(testCase as any) // Cast to any to handle complex types
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result as TestCaseRow;
  }

  /**
   * Create a new test case with application types
   * @param testCase The test case data
   * @returns The created test case
   */
  async createTestCase(testCase: CreateTestCaseInput & { createdBy: string }): Promise<TestCase> {
    // Map application types to database types
    const dbRow: TestCaseInsert = {
      story_id: testCase.storyId,
      title: testCase.title,
      description: testCase.description,
      steps: testCase.steps as any, // Cast to any to handle complex types
      expected_result: testCase.expectedResult,
      status: 'draft',
      priority: testCase.priority || 'medium',
      preconditions: testCase.preconditions || null,
      postconditions: testCase.postconditions || null,
      created_by: testCase.createdBy,
      jira_id: null,
    };

    const result = await this.create(dbRow);
    return this.toTestCase(result);
  }

  /**
   * Get a test case by ID
   * @param id The ID of the test case
   * @returns The test case or null if not found
   */
  async getById(id: string): Promise<TestCase | null> {
    const row = await this.findById(id);
    return row ? this.toTestCase(row) : null;
  }

  /**
   * Update an existing test case
   * @param id The ID of the test case to update
   * @param updates The fields to update
   * @returns The updated test case or null if not found
   */
  async updateTestCase(id: string, updates: UpdateTestCaseInput): Promise<TestCase | null> {
    // Map application updates to database updates
    const updateData: TestCaseUpdate = {
      ...updates as any, // Cast to any to handle complex types
      updated_at: new Date().toISOString(),
    };

    try {
      const result = await this.update(id, updateData);
      return result ? this.toTestCase(result) : null;
    } catch (error) {
      if ((error as PostgrestError).code === 'PGRST116') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Count test cases by status for a story
   * @param storyId The ID of the story
   * @returns Object with counts for each status
   */
  async countByStatus(storyId: string): Promise<Record<TestCaseStatus, number>> {
    const testCases = await this.findAll({ story_id: storyId } as any);
    const counts: Record<TestCaseStatus, number> = {
      draft: 0,
      ready_for_review: 0,
      in_review: 0,
      approved: 0,
      in_progress: 0,
      done: 0,
    };

    testCases.forEach((testCase) => {
      const status = testCase.status as TestCaseStatus;
      if (status in counts) {
        counts[status]++;
      }
    });

    return counts;
  }
}

export default TestCaseRepository;
