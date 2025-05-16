// @ts-nocheck
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { supabase } = require('../supabaseClient');
const router = express.Router();

// Set up multer for file uploads (local storage for now)
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Upload a document and associate with a project
const { extractTextFromFile, generateEmbedding } = require('../services/documentProcessing');

router.post('/:projectId/upload', upload.single('file'), async (req, res) => {
  const { projectId } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  // Save file metadata to Supabase
  const { data, error } = await supabase
    .from('documents')
    .insert([
      {
        project_id: projectId,
        filename: file.originalname,
        filepath: file.path,
        mimetype: file.mimetype,
        size: file.size
      }
    ])
    .select();
  if (error) return res.status(500).json({ error: error.message });

  // --- Document processing and embedding ---
  try {
    const text = await extractTextFromFile(file.path);
    // Store document chunks and embeddings in document_embeddings
    const { storeDocumentEmbeddings } = require('../services/documentProcessing');
    const chunkCount = await storeDocumentEmbeddings(data[0].id, text);
    data[0].embedding = null; // No single embedding, use chunked
    data[0].chunkCount = chunkCount;
  } catch (err) {
    // Optionally log error, but do not fail upload
    data[0].embedding = null;
    data[0].chunkCount = 0;
  }

  res.json(data[0]);
});

// List documents for a project
router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', projectId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Download a document by document ID
router.get('/download/:documentId', async (req, res) => {
  const { documentId } = req.params;
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Document not found' });
  res.download(data.filepath, data.filename);
});

module.exports = router;
