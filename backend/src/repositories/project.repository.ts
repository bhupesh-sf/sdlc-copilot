import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { BaseRepository } from './base.repository';

type Project = Database['public']['Tables']['projects']['Row'];

type CreateProject = {
  name: string;
  created_by: string;
  jira_id?: string | null;
  description?: string | null;
};

type UpdateProject = {
  name?: string;
  jira_id?: string | null;
  description?: string | null;
};

type ProjectWithStories = Project & {
  stories_count?: number;
  documents_count?: number;
};

export class ProjectRepository extends BaseRepository<Project> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'projects');
  }

  /**
   * Find a project by JIRA ID
   */
  async findByJiraId(jiraId: string): Promise<Project | null> {
    const { data, error } = await this.table
      .select('*')
      .eq('jira_id', jiraId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Project;
  }

  /**
   * Find all projects created by a specific user with counts
   */
  async findByUser(userId: string): Promise<ProjectWithStories[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select(
        `
        *,
        stories:stories(count),
        documents:documents(count)
      `
      )
      .eq('created_by', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(project => ({
      ...project,
      stories_count: (project as any).stories?.[0]?.count || 0,
      documents_count: (project as any).documents?.[0]?.count || 0,
    }));
  }

  /**
   * Find all projects created by a specific user (alias for findByUser for backward compatibility)
   */
  async findByCreator(createdBy: string): Promise<Project[]> {
    return this.findAll({ created_by: createdBy });
  }

  /**
   * Create a new project
   */
  async createProject(data: CreateProject): Promise<Project> {
    return this.create(data);
  }

  /**
   * Update a project
   */
  async updateProject(id: string, data: UpdateProject): Promise<Project> {
    return this.update(id, data);
  }

  /**
   * Delete a project and its related data
   */
  async deleteProject(id: string): Promise<boolean> {
    // Note: Make sure to set up proper cascade deletes in your database
    return this.delete(id);
  }
}
