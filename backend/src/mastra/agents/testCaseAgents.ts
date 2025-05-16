import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { anthropic } from '@ai-sdk/anthropic';
import { searchDocumentsTool } from '../tools/documentTools';

export const analyzeAgent = new Agent({
  name: 'Analyze Agent',
  instructions: `
    You are an Analyze Agent responsible for understanding user stories and generating comprehensive test cases.
    
    Your tasks:
    1. Thoroughly analyze the provided user story
    2. Identify all possible test scenarios
    3. Consider edge cases and boundary conditions
    4. Determine test data requirements
    5. Identify any dependencies or prerequisites for testing
    
    Output format:
    {
      testScenarios: {
        description: string;
        testCases: {
          title: string;
          steps: string[];
          expectedResults: string[];
          priority: 'high' | 'medium' | 'low';
        }[];
      }[];
      testDataRequirements: string[];
      dependencies: string[];
    }
  `,
  model: anthropic('claude-3-5-sonnet-20241022'),
  tools: {
    searchDocuments: searchDocumentsTool
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
    options: {
      lastMessages: 10,
      semanticRecall: true,
    },
  }),
});

export const testCaseValidationAgent = new Agent({
  name: 'Test Case Validation Agent',
  instructions: `
    You are a Test Case Validation Agent responsible for ensuring test case quality and completeness.
    
    Your tasks:
    1. Review the generated test cases for completeness
    2. Verify all acceptance criteria are covered
    3. Check for redundant or missing test cases
    4. Ensure test cases are clear and actionable
    5. Provide specific, actionable feedback for improvement
    
    Be thorough in your review and provide concrete suggestions.
  `,
  model: anthropic('claude-3-5-sonnet-20241022'),
  tools: {
    searchDocuments: searchDocumentsTool
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
    options: {
      lastMessages: 15,
      semanticRecall: true,
    },
  }),
});

export const testCaseCreationAgent = new Agent({
  name: 'Test Case Creation Agent',
  instructions: `
    You are a Test Case Creation Agent responsible for generating detailed, executable test cases.
    
    Your tasks:
    1. Based on the analysis and any validation feedback, create detailed test cases
    2. Format test cases with clear steps and expected results
    3. Include any necessary test data or setup steps
    4. Ensure test cases are independent and maintainable
    
    Output format (array of):
    {
      title: string;
      description: string;
      steps: string[];
      expectedResults: string[];
      priority: 'high' | 'medium' | 'low';
      testData?: Record<string, any>;
    }
  `,
  model: anthropic('claude-3-5-sonnet-20241022'),
  tools: {
    searchDocuments: searchDocumentsTool
  },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
    options: {
      lastMessages: 10,
      semanticRecall: true,
    },
  }),
});
