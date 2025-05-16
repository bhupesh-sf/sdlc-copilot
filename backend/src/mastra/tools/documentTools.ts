import { createTool } from '@mastra/core/tools';
import type { Tool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabase, generateEmbedding } from '../../lib/supabase';

// Define schemas for input validation
const searchDocumentsSchema = z.object({
  projectId: z.string(),
  query: z.string(),
  limit: z.number().optional().default(5)
});

const storeDocumentSchema = z.object({
  projectId: z.string(),
  name: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional()
});

const getDocumentSchema = z.object({
  documentId: z.string()
});

// Define tool input types
type SearchDocumentsInput = {
  projectId: string;
  query: string;
  limit: number;
};

type StoreDocumentInput = {
  projectId: string;
  name: string;
  content: string;
  metadata?: Record<string, any>;
};

type GetDocumentInput = {
  documentId: string;
};

type Document = {
  id: string;
  name: string;
  content: string;
  metadata: Record<string, any>;
  similarity?: number;
  project_id?: string;
  created_at?: string;
  updated_at?: string;
};

// Helper function to handle tool execution with error handling
async function withErrorHandling<T>(
  fn: () => Promise<T>,
  toolName: string = 'document tool'
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`Error in ${toolName}:`, error);
    throw new Error(`Document operation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Document search tool
export const searchDocumentsTool = createTool({
  id: 'search-documents',
  description: 'Search project documents for relevant information',
  inputSchema: searchDocumentsSchema,
  execute: async (input: unknown) => {
    return withErrorHandling(async () => {
      const { projectId, query, limit } = searchDocumentsSchema.parse(input);
      
      // Generate embedding for the query
      const embedding = await generateEmbedding(query);
      
      // Search for similar documents using the match_documents function
      const { data: documents, error } = await supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit,
        filter: { project_id: projectId }
      });
      
      if (error) throw error;
      return documents || [];
    });
  }
});

// Document storage tool
export const storeDocumentTool = createTool({
  id: 'store-document',
  description: 'Store a new document in the database with vector embeddings',
  inputSchema: storeDocumentSchema,
  execute: async (input: unknown) => {
    return withErrorHandling(async () => {
      const { projectId, name, content, metadata = {} } = storeDocumentSchema.parse(input);
      
      // Generate embedding for the document content
      const embedding = await generateEmbedding(content);
      
      // Store the document in the database
      const { data: document, error } = await supabase
        .from('documents')
        .insert([{ 
          project_id: projectId, 
          name, 
          content, 
          embedding,
          metadata 
        }])
        .select('id')
        .single();
      
      if (error) throw error;
      if (!document) throw new Error('Failed to store document');
      
      return { id: document.id, success: true };
    });
  }
});

// Document retrieval tool
export const getDocumentTool = createTool({
  id: 'get-document',
  description: 'Get a document by ID',
  inputSchema: getDocumentSchema,
  execute: async (input: unknown) => {
    return withErrorHandling(async () => {
      const { documentId } = getDocumentSchema.parse(input);
      
      const { data: document, error } = await supabase
        .from('documents')
        .select('id, name, content, metadata')
        .eq('id', documentId)
        .single();
      
      if (error) throw error;
      if (!document) throw new Error('Document not found');
      
      return document;
    });
  }
});

// Export all tools for easy importing
export const documentTools = [
  searchDocumentsTool,
  storeDocumentTool,
  getDocumentTool
];
