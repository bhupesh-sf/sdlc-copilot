export type TestCaseStatus = 'draft' | 'ready_for_review' | 'in_review' | 'approved' | 'in_progress' | 'done';
export type TestCasePriority = 'low' | 'medium' | 'high' | 'critical';

export interface TestStep {
  action: string;
  expected: string;
}

export interface TestCase {
  id: string;
  storyId: string;
  title: string;
  description: string;
  steps: TestStep[];
  expectedResult: string;
  status: TestCaseStatus;
  priority: TestCasePriority;
  jiraId?: string | null;
  preconditions?: string | null;
  postconditions?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  workflowId?: string;
}

export interface CreateTestCaseInput {
  storyId: string;
  title: string;
  description: string;
  steps: TestStep[];
  expectedResult: string;
  priority?: TestCasePriority;
  jiraId?: string | null;
  preconditions?: string | null;
  postconditions?: string | null;
  workflowId?: string;
}

export interface UpdateTestCaseInput {
  title?: string;
  description?: string;
  steps?: TestStep[];
  expectedResult?: string;
  status?: TestCaseStatus;
  priority?: TestCasePriority;
  jiraId?: string | null;
  preconditions?: string | null;
  postconditions?: string | null;
  workflowId?: string;
}

export interface WorkflowRepository {
  getWorkflowState(workflowId: string): Promise<string>;
  getWorkflowResult(workflowId: string): Promise<{
    testCases: Array<{
      title: string;
      description: string;
      steps: TestStep[];
      expectedResult: string;
      priority: TestCasePriority;
    }>;
  }>;
}
