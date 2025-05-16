// @ts-nocheck
const { createAgent, createWorkflow, runWorkflow } = require('@mastra/core');
const { AnthropicClient } = require('@ai-sdk/anthropic');
const { createTool } = require('@mastra/core/tools');
const { supabase } = require('../supabaseClient');

const anthropic = new AnthropicClient({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function callClaude(prompt, systemPrompt) {
  const response = await anthropic.completions.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 512,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  });
  return response?.content?.trim?.() || '';
}

// --- Input Agent ---
// Accepts user input and document IDs (document upload handled elsewhere)
const inputAgent = createAgent({
  name: 'InputAgent',
  run: async ({ input, documentIds }) => {
    // Pass through input and doc IDs for next step
    return { clarifiedInput: input, documentIds };
  }
});

// --- Vector Search Tool for Document Retrieval ---
// This tool finds the most relevant document chunks for a user query using Supabase vector DB
const axios = require('axios');
const documentVectorSearchTool = createTool({
  id: 'document-vector-search',
  description: 'Finds relevant project document content for a user query using embeddings.',
  inputSchema: require('zod').object({
    query: require('zod').string(),
    documentIds: require('zod').array(require('zod').string()).optional(),
    topK: require('zod').number().optional()
  }),
  outputSchema: require('zod').object({
    relevantText: require('zod').string(),
  }),
  execute: async ({ context: { query, documentIds, topK = 3 } }) => {
    // 1. Embed the query
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) throw new Error('Missing OPENAI_API_KEY');
    const embedResp = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: query,
        model: 'text-embedding-3-small'
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const queryEmbedding = embedResp.data.data[0].embedding;
    // 2. Search Supabase vector DB for top K similar chunks
    // Supabase SQL: order by embedding <=> queryEmbedding limit topK
    let sql = `select chunk_text from document_embeddings`;
    let filters = [];
    if (documentIds && documentIds.length) {
      filters.push(`document_id in (${documentIds.map(id => `'${id}'`).join(',')})`);
    }
    if (filters.length) sql += ' where ' + filters.join(' and ');
    sql += ` order by embedding <#> '[${queryEmbedding.join(',')}]' limit ${topK}`;
    // Use Supabase RPC or SQL API
    const supabaseKey = process.env.SUPABASE_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    if (error) throw new Error(error.message);
    const topChunks = (data || []).map(r => r.chunk_text);
    return { relevantText: topChunks.join('\n---\n') };
  }
});

// --- Clarification Agent ---
// Now uses vector search tool for relevant document context
const clarificationAgent = createAgent({
  name: 'ClarificationAgent',
  run: async ({ clarifiedInput, documentIds, clarificationHistory = [] }, context) => {
    // Use vector search tool to get relevant context
    const { relevantText } = await documentVectorSearchTool.execute({ context: { query: clarifiedInput, documentIds } });
    const systemPrompt = `You are a requirements analyst. Based on the user input and the following relevant project document context, generate clarifying questions if needed. If everything is clear, reply 'NO_CLARIFICATION_NEEDED'.\n\nRelevant context:\n${relevantText}`;
    const clarification = await callClaude(clarifiedInput, systemPrompt);
    return { clarified: clarification, clarificationHistory: [...clarificationHistory, clarification], documentIds };
  }
});

// --- Story Creation Agent ---
const storyCreationAgent = createAgent({
  name: 'StoryCreationAgent',
  run: async ({ clarified }) => {
    const systemPrompt = 'You are an Agile story writer. Write a complete, well-structured user story in the format: As a [user], I want to [do something], so that [goal]. Add acceptance criteria.';
    const story = await callClaude(clarified, systemPrompt);
    return { story };
  }
});

// --- Validation Agent ---
// If issues, provides feedback and expects user approval before looping
const validationAgent = createAgent({
  name: 'ValidationAgent',
  run: async ({ story, validationHistory = [] }, context) => {
    const systemPrompt = 'You are a QA expert. Validate the following user story for clarity, completeness, and testability. If valid, reply VALID. If not, reply INVALID and explain why.';
    const validation = await callClaude(story, systemPrompt);
    const isValid = validation.toUpperCase().includes('VALID');
    return { validatedStory: story, isValid, validationFeedback: validation, validationHistory: [...validationHistory, validation] };
  }
});

// --- Workflow as a state machine ---
// Each step expects user approval/response before proceeding to next (multi-turn)
const storyWorkflow = createWorkflow({
  name: 'StoryCreationWorkflow',
  steps: [inputAgent, clarificationAgent, storyCreationAgent, validationAgent]
});

// Main entry: accepts workflow state, returns next step, expects frontend to drive approval/iteration
async function runStoryWorkflow(workflowState) {
  // workflowState: { step, input, documentIds, clarificationHistory, validationHistory, ... }
  let state = { ...workflowState };
  // Step 1: Input Agent (if not already done)
  if (!state.step || state.step === 'input') {
    const res = await inputAgent.run({ input: state.input, documentIds: state.documentIds });
    state = { ...state, ...res, step: 'clarification' };
    return { nextStep: 'clarification', state };
  }
  // Step 2: Clarification Agent
  if (state.step === 'clarification') {
    const res = await clarificationAgent.run({ clarifiedInput: state.clarifiedInput, documentIds: state.documentIds, clarificationHistory: state.clarificationHistory });
    state = { ...state, ...res };
    // If LLM says NO_CLARIFICATION_NEEDED, proceed
    if (/NO_CLARIFICATION_NEEDED/i.test(res.clarified)) {
      state.step = 'storyCreation';
      return { nextStep: 'storyCreation', state };
    }
    // Else, expect user to answer clarification and call again
    return { nextStep: 'clarification_user', clarification: res.clarified, state };
  }
  // Step 2b: User answers clarification
  if (state.step === 'clarification_user') {
    // User must provide updated clarifiedInput
    // (Frontend should update state.clarifiedInput and call again with step: 'clarification')
    return { nextStep: 'clarification', state };
  }
  // Step 3: Story Creation Agent
  if (state.step === 'storyCreation') {
    const res = await storyCreationAgent.run({ clarified: state.clarified });
    state = { ...state, ...res, step: 'validation' };
    return { nextStep: 'validation', state };
  }
  // Step 4: Validation Agent
  if (state.step === 'validation') {
    const res = await validationAgent.run({ story: state.story, validationHistory: state.validationHistory });
    state = { ...state, ...res };
    if (res.isValid) {
      state.step = 'finalize';
      return { nextStep: 'finalize', state };
    }
    // Else, expect user to approve feedback or not
    return { nextStep: 'validation_user', feedback: res.validationFeedback, state };
  }
  // Step 4b: User feedback on validation
  if (state.step === 'validation_user') {
    // If user accepts feedback, update clarified and go back to storyCreation
    // If user rejects, finalize
    // (Frontend should update state.clarified or set state.step = 'finalize')
    return { nextStep: state.userAccepted ? 'storyCreation' : 'finalize', state };
  }
  // Step 5: Finalize (store in DB, JIRA sync if needed)
  if (state.step === 'finalize') {
    // Save to DB, call JIRA sync if needed (handled in route)
    return { nextStep: 'done', state };
  }
  return { nextStep: 'unknown', state };
}

// --- JIRA Sync Utility (stub) ---
async function syncJiraStory(storyRecord) {
  // TODO: Implement JIRA API integration here
  // Example: Use axios or fetch to POST to JIRA REST API
  // Use storyRecord fields: story, prompt, project_id, etc.
  // Return JIRA issue key or URL
  return { status: 'stub', message: 'JIRA sync not implemented yet.' };
}

module.exports = {
  runStoryWorkflow,
  syncJiraStory
};
