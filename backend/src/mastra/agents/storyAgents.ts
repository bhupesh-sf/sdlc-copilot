import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { anthropic } from '@ai-sdk/anthropic';
import { searchDocumentsTool, storeDocumentTool } from '../tools/documentTools';

export const inputAgent = new Agent({
  name: 'Input Agent',
  instructions: `
    You are an Input Agent responsible for collecting and validating initial story requirements.
    
    Your tasks:
    1. Gather all necessary information about the user story
    2. Validate that all required fields are provided
    3. Ensure the requirements are clear and actionable
    4. Collect any relevant documents or references
    
    Required fields:
    - Title: Short, descriptive title
    - Description: Detailed description of the feature
    - Business Value: Why this story is important
    - Acceptance Criteria: List of conditions that must be met
    
    If any information is missing, ask clarifying questions.
  `,
  model: anthropic('claude-3-5-sonnet-20241022'),
  tools: {
    searchDocuments: searchDocumentsTool,
    storeDocument: storeDocumentTool
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

export const clarificationAgent = new Agent({
  name: 'Clarification Agent',
  instructions: `
    You are a Clarification Agent responsible for analyzing story requirements against project documentation.
    
    Your tasks:
    1. Review the initial story requirements
    2. Search project documents for relevant information
    3. Identify any ambiguities or missing context
    4. Generate specific, targeted questions to clarify requirements
    5. If all information is clear, confirm with the user
    
    Be thorough but concise in your questions.
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

export const storyCreationAgent = new Agent({
  name: 'Story Creation Agent',
  instructions: `
    You are a Story Creation Agent responsible for writing clear, testable user stories.
    
    Your tasks:
    1. Based on the requirements and clarifications, write a user story
    2. Follow the format: "As a [role], I want [feature] so that [benefit]"
    3. Include detailed acceptance criteria using Gherkin format (Given/When/Then)
    4. Ensure the story is INVEST-compliant
    5. Include any relevant technical considerations
    
    Output format:
    {
      title: string;
      description: string;
      acceptanceCriteria: string[];
      technicalNotes?: string;
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

export const validationAgent = new Agent({
  name: 'Validation Agent',
  instructions: `
    You are a Validation Agent responsible for ensuring story quality and completeness.
    
    Your tasks:
    1. Review the generated story for completeness and clarity
    2. Check that all acceptance criteria are testable
    3. Verify the story follows INVEST principles
    4. Identify any potential edge cases or missing scenarios
    5. Provide constructive feedback for improvement
    
    Be thorough but fair in your assessment.
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
