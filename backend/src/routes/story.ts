// @ts-nocheck
const express = require('express');
const { runStoryWorkflow } = require('../services/storyWorkflow');
const { supabase } = require('../supabaseClient');
const router = express.Router();

// Multi-turn story workflow endpoint
router.post('/workflow/next', async (req, res) => {
  /**
   * Expects body: {
   *   projectId: string,
   *   workflowState: {
   *     step: string,
   *     input?: string,
   *     documentIds?: string[],
   *     clarifiedInput?: string,
   *     clarificationHistory?: string[],
   *     clarified?: string,
   *     story?: string,
   *     validationHistory?: string[],
   *     userAccepted?: boolean,
   *     ...
   *   },
   *   syncJira?: boolean
   * }
   */
  const { projectId, workflowState, syncJira } = req.body;
  if (!projectId || !workflowState) return res.status(400).json({ error: 'Missing projectId or workflowState' });

  try {
    const { nextStep, state } = await runStoryWorkflow(workflowState);
    // On finalization, store story in DB and optionally sync with JIRA
    if (nextStep === 'done' && state.story) {
      const { data, error } = await supabase
        .from('stories')
        .insert([
          {
            project_id: projectId,
            prompt: state.input,
            story: state.story,
            is_valid: true // finalized
          }
        ])
        .select();
      if (error) return res.status(500).json({ error: error.message });
      // Optionally sync with JIRA
      let jiraResult = null;
      if (syncJira) {
        try {
          // Implement syncJiraStory as a utility
          jiraResult = await syncJiraStory(data[0]);
        } catch (jiraErr) {
          jiraResult = { error: jiraErr.message };
        }
      }
      return res.json({ result: 'finalized', story: data[0], jira: jiraResult });
    }
    // Otherwise, return updated state and next step
    res.json({ nextStep, state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy single-step endpoint (kept for backward compatibility)
router.post('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  try {
    const result = await runStoryWorkflow({ input: prompt });
    // Save story to Supabase
    const { data, error } = await supabase
      .from('stories')
      .insert([
        {
          project_id: projectId,
          prompt,
          story: result.state?.story || result.story,
          is_valid: result.state?.isValid || result.isValid || false
        }
      ])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List stories for a project
router.get('/project/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('project_id', projectId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get a single story
router.get('/:storyId', async (req, res) => {
  const { storyId } = req.params;
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

module.exports = router;
