import { Request } from 'express';
import { DatabaseService } from '../services/database.service';
import { BadRequestException, NotFoundException, UnauthorizedException } from '../middleware/error.middleware';
import { storyWorkflow, testCaseWorkflow } from '../mastra/workflows/storyWorkflow';
import { AuthRequest } from '../middleware/auth.middleware';

export class StoryController {
  constructor(private db: DatabaseService) {}

  async createStory(req: AuthRequest) {
    const { projectId } = req.params;
    const { title, description, businessValue, acceptanceCriteria, documentIds } = req.body;
    const userId = req.user.id;

    // Check if user has access to the project
    const project = await this.db.projects.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.created_by !== userId) {
      throw new UnauthorizedException('Not authorized to create stories in this project');
    }

    // Start the story creation workflow
    // @ts-ignore - Workflow types are not fully compatible
    const workflow = await storyWorkflow.trigger({
      projectId,
      title,
      description,
      businessValue,
      acceptanceCriteria,
      documents: documentIds || []
    });

    // Store the workflow ID for reference
    const story = await this.db.stories.createStory({
      project_id: projectId,
      title,
      description,
      business_value: businessValue,
      acceptance_criteria: acceptanceCriteria,
      status: 'draft',
      // @ts-ignore - workflow_id is not in the type but we need it
      workflow_id: workflow.id,
      created_by: userId
    });

    return { story, workflowId: workflow.id };
  }

  async getStoryWorkflowStatus(req: AuthRequest) {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Get story and check permissions
    const story = await this.db.stories.findById(storyId);
    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const project = await this.db.projects.findById(story.project_id);
    if (project?.created_by !== userId) {
      throw new UnauthorizedException('Not authorized to view this story');
    }

    // Get workflow status
    // @ts-ignore - getWorkflow is not in the type but exists at runtime
    const workflow = await storyWorkflow.getWorkflow((story as any).workflow_id);
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return {
      story,
      status: workflow.status,
      currentStep: workflow.currentStep,
      result: workflow.result,
      error: workflow.error
    };
  }

  async continueStoryWorkflow(req: AuthRequest) {
    const { storyId } = req.params;
    const { input, action } = req.body;
    const userId = req.user.id;

    // Get story and check permissions
    const story = await this.db.stories.findById(storyId);
    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const project = await this.db.projects.findById(story.project_id);
    if (project?.created_by !== userId) {
      throw new UnauthorizedException('Not authorized to update this story');
    }

    // Continue the workflow with user input
    // @ts-ignore - continue is not in the type but exists at runtime
    const workflow = await storyWorkflow.continue((story as any).workflow_id, {
      action,
      input
    });

    // Update story status if workflow is complete
    if (workflow.status === 'completed' && workflow.result) {
      await this.db.stories.updateStory(storyId, {
        status: 'in_review',
        title: workflow.result.title,
        description: workflow.result.description,
        acceptance_criteria: workflow.result.acceptanceCriteria
      });
    }

    return {
      story: await this.db.stories.findById(storyId),
      workflowStatus: workflow.status,
      currentStep: workflow.currentStep,
      result: workflow.result,
      requiresInput: workflow.requiresInput,
      nextStepPrompt: workflow.nextStepPrompt
    };
  }

  async generateTestCases(req: AuthRequest) {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Get story and check permissions
    const story = await this.db.stories.findById(storyId);
    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const project = await this.db.projects.findById(story.project_id);
    if (project?.created_by !== userId) {
      throw new UnauthorizedException('Not authorized to generate test cases for this story');
    }

    // Start the test case generation workflow
    // @ts-ignore - Workflow types are not fully compatible
    const workflow = await testCaseWorkflow.trigger({
      storyId,
      storyDetails: {
        title: story.title,
        description: story.description,
        acceptanceCriteria: story.acceptance_criteria
      },
      projectDocuments: [] // Could include relevant project documents here
    });

    // Store the workflow ID for reference
    const testCase = await this.db.testCases.createTestCase({
      storyId,
      title: `Test Cases for ${story.title}`,
      description: 'Test cases generated by AI',
      steps: [],
      expectedResult: 'Test case will be generated by the workflow',
      workflowId: workflow.id,
      createdBy: userId
    });

    return { testCase, workflowId: workflow.id };
  }

  async getTestCases(req: AuthRequest) {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Get story and check permissions
    const story = await this.db.stories.findById(storyId);
    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const project = await this.db.projects.findById(story.project_id);
    if (project?.created_by !== userId) {
      throw new UnauthorizedException('Not authorized to view test cases for this story');
    }

    // Get all test cases for the story
    const testCases = await this.db.testCases.findByStory(storyId);
    return { testCases };
  }

  async syncWithJira(req: AuthRequest) {
    const { storyId } = req.params;
    const { jiraToken, jiraUrl } = req.body;
    const userId = req.user.id;

    // Get story and check permissions
    const story = await this.db.stories.findById(storyId);
    if (!story) {
      throw new NotFoundException('Story not found');
    }

    const project = await this.db.projects.findById(story.project_id);
    if (project?.created_by !== userId) {
      throw new UnauthorizedException('Not authorized to sync this story');
    }

    // In a real implementation, we would call the JIRA API here
    // For the hackathon, we'll just simulate a successful sync
    const jiraId = `JIRA-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Update the story with the JIRA ID
    const updatedStory = await this.db.stories.updateStory(storyId, {
      jira_id: jiraId
    });

    return { 
      success: true, 
      message: 'Story synced with JIRA successfully',
      jiraId,
      story: updatedStory
    };
  }
}

export default StoryController;
