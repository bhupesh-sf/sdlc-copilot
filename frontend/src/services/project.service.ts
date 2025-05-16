import axios, { AxiosInstance } from 'axios';
import { getAccessToken } from '../utils/token.utils';
import { 
  Project, 
  CreateProjectDTO,
  CreateProjectWithFilesDTO,
  ProjectsResponse,
  ProjectResponse,
  ProjectFilesResponse 
} from '../types/project.types';

class ProjectService {
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

  async getProjects(): Promise<ProjectsResponse> {
    try {
      const response = await this.api.get<ProjectsResponse>('/');
      return response.data;
    } catch (error) {
      return {
        data: { projects: [] },
        error: error instanceof Error ? error.message : 'Failed to fetch projects'
      };
    }
  }

  async getProject(projectId: string): Promise<ProjectResponse> {
    try {
      const response = await this.api.get<Project>(`/${projectId}`);
      return {
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch project'
      };
    }
  }

  async createProject(data: CreateProjectWithFilesDTO): Promise<ProjectResponse> {
    try {
      // First create the project with basic info
      const projectResponse = await this.api.post<Project>('/', {
        name: data.name,
        description: data.description,
        jira_id: data.jira_id
      });

      const project = projectResponse.data;

      // Then upload files if any
      if (data.files && data.files.length > 0) {
        const formData = new FormData();
        data.files.forEach(file => {
          formData.append('files', file);
        });

        await this.api.post(`/${project.id}/files`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
            // Emit progress event (can be handled by a state manager or callback)
            console.log('Upload Progress:', percentCompleted);
          }
        });
      }

      return {
        data: project,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create project'
      };
    }
  }

  async getProjectFiles(projectId: string): Promise<ProjectFilesResponse> {
    try {
      const response = await this.api.get<ProjectFilesResponse>(`/${projectId}/files`);
      return response.data;
    } catch (error) {
      return {
        data: { files: [] },
        error: error instanceof Error ? error.message : 'Failed to fetch project files'
      };
    }
  }

  async uploadFiles(projectId: string, files: File[]): Promise<ProjectFilesResponse> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await this.api.post<ProjectFilesResponse>(`/${projectId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          console.log('Upload Progress:', percentCompleted);
        }
      });

      return response.data;
    } catch (error) {
      return {
        data: { files: [] },
        error: error instanceof Error ? error.message : 'Failed to upload files'
      };
    }
  }

  async downloadFile(projectId: string, fileId: string): Promise<Blob> {
    const response = await this.api.get(`/${projectId}/files/${fileId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

// Export a singleton instance
export const projectService = new ProjectService();