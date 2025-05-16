import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { BaseRepository } from './base.repository';

type Story = Database['public']['Tables']['stories']['Row'];

type StoryStatus = 'draft' | 'in_review' | 'approved' | 'in_progress' | 'done';
type StoryPriority = 'low' | 'medium' | 'high' | 'critical';

type CreateStory = {
  project_id: string;
  title: string;
  description: string;
  status: StoryStatus;
  priority: StoryPriority;
  created_by: string;
  jira_id?: string | null;
  acceptance_criteria: string[];
  story_points?: number | null;
  business_value?: string | null;
};

type UpdateStory = {
  title?: string;
  description?: string;
  status?: StoryStatus;
  priority?: StoryPriority;
  jira_id?: string | null;
  acceptance_criteria?: string[];
  story_points?: number | null;
  business_value?: string | null;
};

export class StoryRepository extends BaseRepository<Story> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'stories');
  }

  /**
   * Find all stories for a specific project
   * @param projectId The ID of the project
   * @param status Optional status filter
   * @returns Array of stories
   */
  async findByProject(
    projectId: string,
    status?: Story['status']
  ): Promise<Story[]> {
    let query = this.table.select('*').eq('project_id', projectId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Story[];
  }

  /**
   * Find stories by JIRA ID
   * @param jiraId The JIRA issue ID
   * @returns Array of matching stories
   */
  async findByJiraId(jiraId: string): Promise<Story[]> {
    const { data, error } = await this.table
      .select('*')
      .eq('jira_id', jiraId);

    if (error) throw error;
    return (data || []) as Story[];
  }

  /**
   * Create a new story
   * @param story The story data
   * @returns The created story
   */
  async createStory(story: CreateStory): Promise<Story> {
    // Explicitly map fields to match the database schema
    const storyData = {
      project_id: story.project_id,
      title: story.title,
      description: story.description,
      status: story.status,
      priority: story.priority,
      created_by: story.created_by,
      jira_id: story.jira_id || null,
      acceptance_criteria: story.acceptance_criteria || [],
      story_points: story.story_points || null,
      business_value: story.business_value || null,
    };
    
    return this.create(storyData);
  }

  /**
   * Update an existing story
   * @param id The ID of the story to update
   * @param updates The fields to update
   * @returns The updated story
   */
  async updateStory(id: string, updates: UpdateStory): Promise<Story> {
    // Create a new object with only the fields we want to update
    const updateData: Record<string, unknown> = {};

    // Only include fields that are actually being updated
    if ('title' in updates) updateData.title = updates.title;
    if ('description' in updates) updateData.description = updates.description;
    if ('status' in updates) updateData.status = updates.status;
    if ('priority' in updates) updateData.priority = updates.priority;
    if ('jira_id' in updates) updateData.jira_id = updates.jira_id ?? null;
    if ('acceptance_criteria' in updates) {
      updateData.acceptance_criteria = updates.acceptance_criteria ?? [];
    }
    if ('story_points' in updates) {
      updateData.story_points = updates.story_points ?? null;
    }
    if ('business_value' in updates) {
      updateData.business_value = updates.business_value ?? null;
    }

    return this.update(id, updateData);
  }

  /**
   * Delete a story by ID
   * @param id The ID of the story to delete
   * @returns True if the story was deleted
   */
  async deleteStory(id: string): Promise<boolean> {
    return this.delete(id);
  }

  /**
   * Count stories by status for a project
   * @param projectId The ID of the project
   * @returns Object with counts for each status
   */
  async countByStatus(projectId: string): Promise<Record<StoryStatus, number>> {
    const { data, error } = await this.table
      .select('status')
      .eq('project_id', projectId);

    if (error) throw error;

    const counts: Record<StoryStatus, number> = {
      draft: 0,
      in_review: 0,
      approved: 0,
      in_progress: 0,
      done: 0,
    };

    // Count occurrences of each status
    data?.forEach(({ status }) => {
      if (status in counts) {
        counts[status as StoryStatus]++;
      }
    });

    return counts;
  }
}
