export interface Story {
  id: string;
  project_id: string;
  title: string;
  description: string;
  business_value: string;
  acceptance_criteria: string;
  status: 'draft' | 'in_review' | 'completed';
  created_by: string;
  workflow_id?: string;
  jira_id?: string;
}

export interface CreateStoryData {
  title: string;
  description: string;
  businessValue: string;
  acceptanceCriteria: string;
  documentIds?: string[];
}

export interface StoriesResponse {
  data: {
    stories: Story[];
  };
  error: string | null;
}

export interface StoryResponse {
  data: Story | null;
  error: string | null;
}