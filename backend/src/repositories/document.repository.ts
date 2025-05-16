import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { BaseRepository } from './base.repository';

type Document = Database['public']['Tables']['documents']['Row'];

type CreateDocument = {
  project_id: string;
  name: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  created_by: string;
};

type UpdateDocument = {
  name?: string;
  content?: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
};

type SearchResult = {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
};

export class DocumentRepository extends BaseRepository<Document> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'documents');
  }

  /**
   * Find all documents for a specific project
   * @param projectId The ID of the project
   * @returns Array of documents
   */
  async findByProject(projectId: string): Promise<Document[]> {
    return this.findAll({ project_id: projectId });
  }

  /**
   * Search for documents similar to the provided embedding
   * @param queryEmbedding The embedding vector to compare against
   * @param matchThreshold The similarity threshold (0-1)
   * @param matchCount Maximum number of matches to return
   * @param projectId Optional project ID to filter by
   * @returns Array of search results with similarity scores
   */
  async searchSimilar(
    queryEmbedding: number[],
    matchThreshold = 0.5,
    matchCount = 5,
    projectId?: string
  ): Promise<SearchResult[]> {
    let query = this.supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as SearchResult[];
  }

  /**
   * Create a new document with the provided data
   * @param document The document data
   * @returns The created document
   */
  async createDocument(document: CreateDocument): Promise<Document> {
    return this.create({
      ...document,
      metadata: document.metadata || {},
    });
  }

  /**
   * Update an existing document
   * @param id The ID of the document to update
   * @param updates The fields to update
   * @returns The updated document
   */
  async updateDocument(id: string, updates: UpdateDocument): Promise<Document> {
    return this.update(id, {
      ...updates,
      metadata: updates.metadata || {},
    });
  }

  /**
   * Delete a document by ID
   * @param id The ID of the document to delete
   * @returns True if the document was deleted
   */
  async deleteDocument(id: string): Promise<boolean> {
    return this.delete(id);
  }
}
