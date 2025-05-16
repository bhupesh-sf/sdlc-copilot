// @ts-nocheck
const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * Extract text from a file (currently supports .txt only)
 */
async function extractTextFromFile(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  if (ext === '.txt') {
    return fs.readFileSync(filepath, 'utf8');
  }
  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filepath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }
  if (ext === '.docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filepath });
    return result.value;
  }
  throw new Error('Unsupported file type for text extraction');
}

/**
 * Generate embedding for given text using an external embedding API (stub for now)
 */
const { supabase } = require('../supabaseClient');
const axios = require('axios');

// Chunk text into ~500 token segments (simple sentence split for now)
function chunkText(text, chunkSize = 1500) {
  const chunks = [];
  let current = '';
  for (const line of text.split(/(?<=[.!?])\s+/)) {
    if ((current + line).length > chunkSize && current.length > 0) {
      chunks.push(current);
      current = '';
    }
    current += (current ? ' ' : '') + line;
  }
  if (current) chunks.push(current);
  return chunks;
}

// Generate embedding for given text using OpenAI API
async function generateEmbedding(text) {
  // Requires OPENAI_API_KEY in env
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
  const resp = await axios.post(
    'https://api.openai.com/v1/embeddings',
    {
      input: text,
      model: 'text-embedding-3-small'
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return resp.data.data[0].embedding;
}

// Store document chunks and embeddings in Supabase
document_embeddings
async function storeDocumentEmbeddings(documentId, text) {
  const chunks = chunkText(text);
  const records = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);
    records.push({
      document_id: documentId,
      chunk_index: i,
      chunk_text: chunk,
      embedding
    });
  }
  // Insert all records into document_embeddings
  for (const rec of records) {
    await supabase.from('document_embeddings').insert({
      document_id: rec.document_id,
      chunk_index: rec.chunk_index,
      chunk_text: rec.chunk_text,
      embedding: rec.embedding
    });
  }
  return records.length;
}

module.exports = {
  extractTextFromFile,
  generateEmbedding,
  chunkText,
  storeDocumentEmbeddings
};
