import { Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { inputAgent, clarificationAgent, storyCreationAgent, validationAgent } from '../agents/storyAgents';
import { analyzeAgent, testCaseValidationAgent, testCaseCreationAgent } from '../agents/testCaseAgents';

// Define the story workflow
const storyWorkflow = new Workflow({
  name: 'story-workflow',
  triggerSchema: z.object({
    projectId: z.string().describe('The project ID to associate with this story'),
    title: z.string().describe('Brief title of the user story'),
    description: z.string().describe('Detailed description of the feature'),
    businessValue: z.string().describe('Why this story is important'),
    acceptanceCriteria: z.array(z.string()).describe('List of acceptance criteria'),
    documents: z.array(z.string()).optional().describe('Optional document IDs for reference')
  })
});

// Add steps to the workflow
storyWorkflow
  .step(inputAgent)
  .then(clarificationAgent)
  .then(storyCreationAgent)
  .then(validationAgent);

// Define the test case workflow
const testCaseWorkflow = new Workflow({
  name: 'test-case-workflow',
  triggerSchema: z.object({
    storyId: z.string().describe('The ID of the user story'),
    storyDetails: z.object({
      title: z.string(),
      description: z.string(),
      acceptanceCriteria: z.array(z.string())
    }),
    projectDocuments: z.array(z.string()).optional().describe('Relevant project document IDs')
  })
});

// Add steps to the test case workflow
testCaseWorkflow
  .step(analyzeAgent)
  .then(testCaseCreationAgent)
  .then(testCaseValidationAgent);

// Commit the workflows
storyWorkflow.commit();
testCaseWorkflow.commit();

// Export the workflows
export { storyWorkflow, testCaseWorkflow };

// Default export for better module resolution
export default {
  storyWorkflow,
  testCaseWorkflow
};
