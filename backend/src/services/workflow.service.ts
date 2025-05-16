import { WorkflowState, WorkflowStep, WorkflowContext } from '../types/workflow.types';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { v4 as uuidv4 } from 'uuid';

export class WorkflowService {
  constructor(private workflowRepo: WorkflowRepository) {}

  async startWorkflow(projectId: string, userId: string, requirements: Record<string, unknown>): Promise<WorkflowState> {
    if (!projectId || !userId) {
      throw new Error('Project ID and User ID are required');
    }
    
    const workflowId = uuidv4();
    const now = new Date().toISOString();
    
    const initialState: WorkflowState = {
      id: workflowId,
      projectId,
      userId,
      currentStep: 'requirements_analysis',
      status: 'in_progress',
      context: {
        requirements,
        steps: {}
      },
      metadata: {},
      createdAt: now,
      updatedAt: now
    };
    
    return this.workflowRepo.create(initialState);
  }

  async getWorkflowState(workflowId: string): Promise<WorkflowState | null> {
    if (!workflowId) {
      throw new Error('Workflow ID is required');
    }
    
    return this.workflowRepo.findById(workflowId);
  }

  async updateWorkflowStep(
    workflowId: string,
    step: WorkflowStep,
    contextUpdate: Partial<WorkflowContext>
  ): Promise<WorkflowState> {
    if (!workflowId || !step) {
      throw new Error('Workflow ID and step are required');
    }
    
    const existingWorkflow = await this.workflowRepo.findById(workflowId);
    if (!existingWorkflow) {
      throw new Error('Workflow not found');
    }
    
    // Merge the existing context with the updates
    const updatedContext: WorkflowContext = {
      requirements: {
        ...existingWorkflow.context.requirements,
        ...contextUpdate.requirements
      },
      steps: {
        ...existingWorkflow.context.steps,
        ...contextUpdate.steps,
        [step]: {
          ...existingWorkflow.context.steps[step],
          ...contextUpdate.steps?.[step],
          completedAt: new Date().toISOString()
        }
      }
    };

    // Determine if we should move to the next step or mark as complete
    const nextStep = this.getNextStep(step);
    const isComplete = nextStep === 'complete';

    const updateData: Partial<WorkflowState> = {
      currentStep: isComplete ? step : nextStep,
      status: isComplete ? 'completed' : 'in_progress',
      context: updatedContext,
      updatedAt: new Date().toISOString()
    };

    if (isComplete) {
      updateData.completedAt = new Date().toISOString();
    }

    return this.workflowRepo.update(workflowId, updateData);
  }

  private getNextStep(currentStep: WorkflowStep): WorkflowStep | 'complete' {
    const steps: WorkflowStep[] = [
      'requirements_analysis',
      'story_creation',
      'acceptance_criteria_definition',
      'review_approval'
    ];
    
    const currentIndex = steps.indexOf(currentStep);
    return steps[currentIndex + 1] || 'complete';
  }

  async completeWorkflow(workflowId: string, result: unknown): Promise<WorkflowState> {
    const existingWorkflow = await this.workflowRepo.findById(workflowId);
    if (!existingWorkflow) {
      throw new Error('Workflow not found');
    }

    return this.workflowRepo.update(workflowId, {
      status: 'completed',
      context: {
        requirements: existingWorkflow.context.requirements,
        steps: {
          ...existingWorkflow.context.steps,
          completed: {
            result,
            completedAt: new Date().toISOString()
          }
        }
      },
      completedAt: new Date().toISOString(),
    });
  }

  async failWorkflow(workflowId: string, error: Error): Promise<WorkflowState> {
    const existingWorkflow = await this.workflowRepo.findById(workflowId);
    if (!existingWorkflow) {
      throw new Error('Workflow not found');
    }

    return this.workflowRepo.update(workflowId, {
      status: 'failed',
      context: {
        requirements: existingWorkflow.context.requirements,
        steps: {
          ...existingWorkflow.context.steps,
          failed: {
            error: error.message,
            stack: error.stack,
            failedAt: new Date().toISOString()
          }
        }
      },
      completedAt: new Date().toISOString(),
    });
  }
}
