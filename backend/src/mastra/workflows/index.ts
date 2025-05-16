// Import workflows
import weatherWorkflow from './weatherWorkflow';
import { storyWorkflow, testCaseWorkflow } from './storyWorkflow';

// Re-export all workflows
export { default as weatherWorkflow } from './weatherWorkflow';
export { storyWorkflow, testCaseWorkflow } from './storyWorkflow';

// Export all workflows as a single object
export const workflows = {
  weatherWorkflow,
  storyWorkflow,
  testCaseWorkflow
};
