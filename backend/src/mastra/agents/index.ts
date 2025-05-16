// Story Agents
export * from './storyAgents';

// Test Case Agents
export * from './testCaseAgents';

// Weather Agent (example, can be removed if not needed)
import { anthropic } from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { weatherTool } from '../tools';

export const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: `
    You are a helpful weather assistant that provides accurate weather information.
    This is an example agent and can be removed if not needed.
  `,
  model: anthropic('claude-3-5-sonnet-20241022'),
  tools: { weatherTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
    options: {
      lastMessages: 10,
      semanticRecall: false,
    },
  }),
});
