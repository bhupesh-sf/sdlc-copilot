import { supabase } from '../lib/supabase';
import { WorkflowState, WorkflowContext } from '../types/workflow.types';

export interface WorkflowRecord extends Omit<WorkflowState, 'context'> {
  context: Record<string, unknown>;
}

export class WorkflowRepository {
  private readonly table = 'workflow_states';

  async create(workflow: Omit<WorkflowState, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowState> {
    const now = new Date().toISOString();
    const workflowRecord: Omit<WorkflowState, 'id'> = {
      ...workflow,
      context: {
        requirements: workflow.context.requirements || {},
        steps: workflow.context.steps || {}
      },
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert(workflowRecord)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create workflow: ${error.message}`);
    }

    return this.mapToWorkflowState(data);
  }

  async findById(id: string): Promise<WorkflowState | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      throw new Error(`Failed to find workflow: ${error.message}`);
    }

    return this.mapToWorkflowState(data);
  }

  async update(id: string, updates: Partial<WorkflowState>): Promise<WorkflowState> {
    const existingWorkflow = await this.findById(id);
    if (!existingWorkflow) {
      throw new Error('Workflow not found');
    }

    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Handle context separately to ensure proper typing
    if (updates.context) {
      updateData.context = {
        requirements: updates.context.requirements || {},
        steps: updates.context.steps || {}
      };
    }

    const { data, error } = await supabase
      .from(this.table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update workflow: ${error.message}`);
    }

    return this.mapToWorkflowState(data);
  }

  /**
   * Get the current state of a workflow
   * @param workflowId The ID of the workflow
   * @returns The current state as a string, or null if not found
   */
  async getWorkflowState(workflowId: string): Promise<string | null> {
    const workflow = await this.findById(workflowId);
    if (!workflow) {
      return null;
    }
    return workflow.currentStep;
  }

  /**
   * Get the result of a completed workflow
   * @param workflowId The ID of the workflow
   * @returns The workflow result, or null if not found or not completed
   */
  async getWorkflowResult(workflowId: string): Promise<any> {
    const workflow = await this.findById(workflowId);
    if (!workflow || workflow.status !== 'completed') {
      return null;
    }

    // Extract the result from the completed step
    const completedStep = workflow.context.steps?.completed;
    if (!completedStep) {
      return null;
    }

    return completedStep;
  }

  private mapToWorkflowState(data: any): WorkflowState {
    return {
      ...data,
      context: {
        requirements: data.context?.requirements || {},
        steps: data.context?.steps || {}
      }
    };
  }
}
