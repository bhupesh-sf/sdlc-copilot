import { Request, Response } from 'express';
import { WorkflowService } from '../services/workflow.service';
import { WorkflowRepository } from '../repositories/workflow.repository';

// Extend the Express Request type to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}

export class WorkflowController {
  private workflowService: WorkflowService;

  constructor() {
    this.workflowService = new WorkflowService(new WorkflowRepository());
  }

  async startWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      const { requirements } = req.body;

      const workflow = await this.workflowService.startWorkflow(
        projectId,
        userId,
        requirements
      );

      res.status(201).json(workflow);
    } catch (error) {
      console.error('Error starting workflow:', error);
      res.status(500).json({ error: 'Failed to start workflow' });
    }
  }

  async getWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      const workflow = await this.workflowService.getWorkflowState(workflowId);

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      res.json(workflow);
    } catch (error) {
      console.error('Error getting workflow:', error);
      res.status(500).json({ error: 'Failed to get workflow' });
    }
  }

  async updateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { workflowId } = req.params;
      const { step, context } = req.body;

      const workflow = await this.workflowService.updateWorkflowStep(
        workflowId,
        step,
        context
      );

      res.json(workflow);
    } catch (error) {
      console.error('Error updating workflow:', error);
      res.status(500).json({ error: 'Failed to update workflow' });
    }
  }
}
