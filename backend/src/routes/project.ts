// @ts-nocheck
const express = require('express');
const { supabase } = require('../supabaseClient');
const router = express.Router();

// Create a new project
router.post('/', async (req, res) => {
  const { name, jiraId } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });
  const { data, error } = await supabase
    .from('projects')
    .insert([{ name, jira_id: jiraId }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// Get all projects
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get a single project
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// Update a project
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, jiraId } = req.body;
  const { data, error } = await supabase
    .from('projects')
    .update({ name, jira_id: jiraId })
    .eq('id', id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// Delete a project
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
