// Define our own WorkflowStatus type since it's not exported from workflow.types
export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

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
}

export interface GenerateTestCasesInput {
  content: {
    title: string;
    description: string;
    acceptanceCriteria: string[];
    projectDocuments?: string[];
  };
}

export interface TestCaseWorkflowStatus {
  status: WorkflowStatus;
  currentStep?: string;
  progress?: number;
  message?: string;
}

// Response types
export interface TestCasesResponse {
  data: {
    testCases: TestCase[];
  } | null;
  error: string | null;
}

export interface TestCaseResponse {
  data: TestCase | null;
  error: string | null;
}

export interface GenerateTestCasesResponse {
  data: {
    workflowId: string;
  } | null;
  error: string | null;
}

export interface TestCaseWorkflowStatusResponse {
  data: TestCaseWorkflowStatus | null;
  error: string | null;
}