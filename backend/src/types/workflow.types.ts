export type WorkflowStep = 
  | 'initialized'
  | 'requirements_gathering'
  | 'story_generation'
  | 'review'
  | 'completed'
  | 'failed'
  | 'requirements_analysis'
  | 'story_creation'
  | 'acceptance_criteria_definition'
  | 'review_approval';

export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface WorkflowStepData {
  completedAt?: string;
  failedAt?: string;
  error?: string;
  stack?: string;
  result?: unknown;
  [key: string]: unknown;
}

export interface WorkflowContext {
  requirements: Record<string, unknown>;
  steps: Record<string, WorkflowStepData>;
  [key: string]: unknown;
}

export interface WorkflowState {
  id: string;
  projectId: string;
  userId: string;
  currentStep: WorkflowStep;
  status: WorkflowStatus;
  context: WorkflowContext;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateWorkflowInput {
  projectId: string;
  userId: string;
  initialRequirements?: string;
}

export interface UpdateWorkflowInput {
  step: WorkflowStep;
  context?: Record<string, any>;
  status?: 'in_progress' | 'completed' | 'failed';
}
