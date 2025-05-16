import { Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { analyzeAgent, testCaseValidationAgent, testCaseCreationAgent } from '../agents/testCaseAgents';

// Define workflow states
export const TEST_CASE_STATES = {
  INITIATED: 'initiated',
  ANALYZING: 'analyzing',
  CREATING: 'creating',
  VALIDATING: 'validating',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

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

// Add steps to the workflow
testCaseWorkflow
  .step(analyzeAgent)
  .then(testCaseCreationAgent)
  .then(testCaseValidationAgent);

// Commit the workflow
testCaseWorkflow.commit();

// Export the workflow and states
export { testCaseWorkflow };

// Default export for better module resolution
export default testCaseWorkflow;