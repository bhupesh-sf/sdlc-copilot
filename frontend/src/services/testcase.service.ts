import axios, { AxiosInstance } from 'axios';
import { getAccessToken } from '../utils/token.utils';
import {
  TestCase,
  TestCasesResponse,
  TestCaseResponse,
  GenerateTestCasesInput,
  GenerateTestCasesResponse,
  TestCaseWorkflowStatusResponse
} from '../types/testcase.types';

class TestCaseService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api/testcases',
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

  /**
   * Generate test cases for a story
   */
  async generateTestCases(storyId: string, data: GenerateTestCasesInput): Promise<GenerateTestCasesResponse> {
    try {
      const response = await this.api.post<{ workflowId: string }>(`/generate/${storyId}`, data);
      return {
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to generate test cases'
      };
    }
  }

  /**
   * Get workflow status for a test case generation process
   */
  async getWorkflowStatus(testCaseId: string): Promise<TestCaseWorkflowStatusResponse> {
    try {
      const response = await this.api.get(`/${testCaseId}/workflow`);
      return {
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch workflow status'
      };
    }
  }

  /**
   * Get test cases by story ID
   */
  async getTestCasesByStory(storyId: string): Promise<TestCasesResponse> {
    try {
      const response = await this.api.get<{ testCases: TestCase[] }>(`/story/${storyId}`);
      return {
        data: { testCases: response.data.testCases },
        error: null
      };
    } catch (error) {
      return {
        data: { testCases: [] },
        error: error instanceof Error ? error.message : 'Failed to fetch test cases'
      };
    }
  }

  /**
   * Get a single test case by ID
   */
  async getTestCase(id: string): Promise<TestCaseResponse> {
    try {
      const response = await this.api.get<TestCase>(`/${id}`);
      return {
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch test case'
      };
    }
  }

  /**
   * Update test case status
   */
  async updateStatus(id: string, status: string): Promise<TestCaseResponse> {
    try {
      const response = await this.api.patch<TestCase>(`/${id}/status`, { status });
      return {
        data: response.data,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update test case status'
      };
    }
  }
}

// Export a singleton instance
export const testCaseService = new TestCaseService();