import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { initializeDatabaseService } from '../services/database.service';

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

// Create the Supabase client with TypeScript types
export const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Initialize the database service with the Supabase client
initializeDatabaseService(supabase);

// Helper function to generate embeddings
export async function generateEmbedding(text: string): Promise<number[]> {
  // This is a placeholder implementation
  // In a real implementation, you would call an embedding API (e.g., OpenAI, Cohere, etc.)
  console.warn('Using placeholder embedding - implement generateEmbedding function');
  return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
}

// Export the database service for direct access
export { databaseService } from '../services/database.service';
