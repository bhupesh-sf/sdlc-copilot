import axios, { AxiosInstance } from 'axios';
import { getAccessToken } from '../utils/token.utils';
import { Story, CreateStoryData, StoriesResponse, StoryResponse } from '../types/story.types';

class StoryService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api/projects',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async getStoriesByProject(projectId: string): Promise<StoriesResponse> {
    try {
      const response = await this.api.get<{ stories: Story[] }>(`/${projectId}/stories`);
      return {
        data: { stories: response.data.stories },
        error: null
      };
    } catch (error) {
      return {
        data: { stories: [] },
        error: error instanceof Error ? error.message : 'Failed to fetch stories'
      };
    }
  }

  async createStory(projectId: string, data: CreateStoryData): Promise<StoryResponse> {
    try {
      const response = await this.api.post<Story>(`/${projectId}/stories`, data);
      return {
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create story'
      };
    }
  }
}

// Export a singleton instance
export const storyService = new StoryService();