import { v4 as uuidv4 } from 'uuid';
import { TestCase, CreateTestCaseInput, UpdateTestCaseInput, TestCaseStatus, TestStep } from '../types/testcase.types';
import { TestCaseRepository } from '../repositories/testCase.repository';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { testCaseWorkflow, TEST_CASE_STATES } from '../mastra/workflows/testCaseWorkflow';
import { WorkflowService } from './workflow.service';

type DatabaseTestCase = {
  id: string;
  story_id: string;
  title: string;
  description: string;
  steps: { action: string; expected: string }[];
  expected_result: string;
  status: TestCaseStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  jira_id?: string | null;
  preconditions?: string | null;
  postconditions?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  workflow_id?: string | null;
};

export class TestCaseService {
  private workflowService: WorkflowService;

  constructor(
    private testCaseRepo: TestCaseRepository,
    private workflowRepo: WorkflowRepository
  ) {
    this.workflowService = new WorkflowService(workflowRepo);
  }

  private toTestCase(dbCase: DatabaseTestCase): TestCase {
    return {
      id: dbCase.id,
      storyId: dbCase.story_id,
      title: dbCase.title,
      description: dbCase.description,
      steps: dbCase.steps as TestStep[],
      expectedResult: dbCase.expected_result,
      status: dbCase.status,
      priority: dbCase.priority,
      jiraId: dbCase.jira_id ?? undefined,
      preconditions: dbCase.preconditions ?? undefined,
      postconditions: dbCase.postconditions ?? undefined,
      createdBy: dbCase.created_by,
      createdAt: dbCase.created_at,
      updatedAt: dbCase.updated_at,
      workflowId: dbCase.workflow_id ?? undefined
    };
  }

  private toDatabaseTestCase(testCase: Partial<TestCase>): any {
    const dbCase: any = { ...testCase };
    
    if ('storyId' in testCase) {
      dbCase.story_id = testCase.storyId;
      delete dbCase.storyId;
    }
    
    if ('expectedResult' in testCase) {
      dbCase.expected_result = testCase.expectedResult;
      delete dbCase.expectedResult;
    }
    
    if ('jiraId' in testCase) {
      dbCase.jira_id = testCase.jiraId;
      delete dbCase.jiraId;
    }
    
    if ('createdBy' in testCase) {
      dbCase.created_by = testCase.createdBy;
      delete dbCase.createdBy;
    }
    
    if ('createdAt' in testCase) {
      dbCase.created_at = testCase.createdAt;
      delete dbCase.createdAt;
    }
    
    if ('updatedAt' in testCase) {
      dbCase.updated_at = testCase.updatedAt;
      delete dbCase.updatedAt;
    }

    if ('workflowId' in testCase) {
      dbCase.workflow_id = testCase.workflowId;
      delete dbCase.workflowId;
    }
    
    return dbCase;
  }

  async createTestCase(input: CreateTestCaseInput, userId: string): Promise<TestCase> {
    const testCaseId = uuidv4();
    const now = new Date().toISOString();

    const testCaseData: Omit<TestCase, 'id'> = {
      storyId: input.storyId,
      title: input.title,
      description: input.description,
      steps: input.steps,
      expectedResult: input.expectedResult,
      status: 'draft',
      priority: input.priority || 'medium',
      jiraId: input.jiraId,
      preconditions: input.preconditions,
      postconditions: input.postconditions,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      workflowId: input.workflowId
    };

    const dbData = this.toDatabaseTestCase({
      ...testCaseData,
      id: testCaseId
    });

    const created = await this.testCaseRepo.create(dbData);
    return this.toTestCase(created as unknown as DatabaseTestCase);
  }

  async getTestCaseById(id: string): Promise<TestCase | null> {
    const testCase = await this.testCaseRepo.findById(id);
    return testCase ? this.toTestCase(testCase as unknown as DatabaseTestCase) : null;
  }

  async getTestCasesByStory(storyId: string): Promise<TestCase[]> {
    const testCases = await this.testCaseRepo.findByStory(storyId);
    return testCases.map(tc => this.toTestCase(tc as unknown as DatabaseTestCase));
  }

  async updateTestCase(
    id: string,
    updates: UpdateTestCaseInput,
    userId: string
  ): Promise<TestCase | null> {
    const existing = await this.testCaseRepo.findById(id);
    if (!existing) {
      return null;
    }

    const updateData = this.toDatabaseTestCase({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    const updated = await this.testCaseRepo.update(id, updateData);
    return updated ? this.toTestCase(updated as unknown as DatabaseTestCase) : null;
  }

  async deleteTestCase(id: string): Promise<boolean> {
    return this.testCaseRepo.delete(id);
  }

  async generateTestCasesFromStory(storyId: string, storyDetails: any): Promise<TestCase[]> {
    try {
      // Start the workflow using the workflow service
      const workflowState = await this.workflowService.startWorkflow(
        storyId, // Using storyId as projectId for this workflow
        'system', // System user
        {
          storyId,
          storyDetails: {
            title: storyDetails.title,
            description: storyDetails.description,
            acceptanceCriteria: storyDetails.acceptanceCriteria
          },
          projectDocuments: storyDetails.projectDocuments || []
        }
      );

      // Create initial test case entries
      const testCases = await Promise.all(
        storyDetails.acceptanceCriteria.map(async (criteria: string, index: number) => {
          return this.createTestCase({
            storyId,
            title: `Test Case ${index + 1}: ${criteria.substring(0, 50)}...`,
            description: 'Auto-generated test case - In Progress',
            steps: [],
            expectedResult: criteria,
            priority: 'medium',
            workflowId: workflowState.id
          }, 'system');
        })
      );

      // Monitor workflow state
      const currentState = await this.workflowService.getWorkflowState(workflowState.id);
      
      if (currentState && currentState.status === 'completed') {
        // Extract test case data from workflow context
        const completedStepData = currentState.context.steps?.completed as any;
        const testCaseResults = completedStepData?.result?.testCases || [];
        
        // Update test cases with generated content
        await Promise.all(
          testCases.map(async (testCase, index) => {
            const generatedTestCase = testCaseResults[index];
            if (generatedTestCase) {
              await this.updateTestCase(testCase.id, {
                title: generatedTestCase.title,
                description: generatedTestCase.description,
                steps: generatedTestCase.steps,
                expectedResult: generatedTestCase.expectedResult,
                priority: generatedTestCase.priority,
                status: 'ready_for_review'
              }, 'system');
            }
          })
        );
      }

      return this.getTestCasesByStory(storyId);
    } catch (error) {
      console.error('Error generating test cases:', error);
      throw new Error('Failed to generate test cases');
    }
  }

  async updateStatus(id: string, status: TestCaseStatus, userId: string): Promise<TestCase | null> {
    const updateData = this.toDatabaseTestCase({
      status,
      updatedAt: new Date().toISOString(),
    });

    const updated = await this.testCaseRepo.update(id, updateData);
    return updated ? this.toTestCase(updated as unknown as DatabaseTestCase) : null;
  }

  async getWorkflowStatus(testCaseId: string): Promise<string | null> {
    const testCase = await this.getTestCaseById(testCaseId);
    if (!testCase?.workflowId) {
      return null;
    }
    
    const workflowState = await this.workflowService.getWorkflowState(testCase.workflowId);
    return workflowState ? workflowState.currentStep : null;
  }
}

export default TestCaseService;
