import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { TestCase } from '../types/testcase.types';

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: string;
    status: {
      name: string;
    };
    [key: string]: any;
  };
}

export class JiraService {
  private client: AxiosInstance;

  constructor(private config: JiraConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      auth: {
        username: config.email,
        password: config.apiToken,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  async createIssue(issue: {
    projectId: string;
    summary: string;
    description: string;
    issueType: string;
    [key: string]: any;
  }): Promise<JiraIssue> {
    const response = await this.client.post('/rest/api/3/issue', {
      fields: {
        project: {
          id: issue.projectId,
        },
        summary: issue.summary,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: issue.description,
                },
              ],
            },
          ],
        },
        issuetype: {
          name: issue.issueType,
        },
        ...(issue.labels && { labels: issue.labels }),
        ...(issue.priority && { priority: { name: issue.priority } }),
      },
    });

    return response.data;
  }

  async createTestIssue(testCase: TestCase, projectId: string): Promise<JiraIssue> {
    const steps = testCase.steps
      .map((step, index) => `${index + 1}. *${step.action}*\n   Expected: ${step.expected}`)
      .join('\n\n');

    const description = `*Description:*\n${testCase.description}\n\n` +
      `*Preconditions:*\n${testCase.preconditions || 'None'}\n\n` +
      `*Test Steps:*\n${steps}\n\n` +
      `*Expected Result:*\n${testCase.expectedResult}\n\n` +
      `*Postconditions:*\n${testCase.postconditions || 'None'}`;

    return this.createIssue({
      projectId,
      summary: `[TC] ${testCase.title}`,
      description,
      issueType: 'Test',
      priority: this.mapPriority(testCase.priority),
      labels: ['auto-generated', 'test-case'],
    });
  }

  async getIssue(issueIdOrKey: string): Promise<JiraIssue> {
    const response = await this.client.get(`/rest/api/3/issue/${issueIdOrKey}`);
    return response.data;
  }

  async updateIssue(issueIdOrKey: string, updates: any): Promise<void> {
    await this.client.put(`/rest/api/3/issue/${issueIdOrKey}`, {
      fields: updates,
    });
  }

  async addComment(issueIdOrKey: string, comment: string): Promise<void> {
    await this.client.post(`/rest/api/3/issue/${issueIdOrKey}/comment`, {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: comment,
              },
            ],
          },
        ],
      },
    });
  }

  async getIssuesByJql(jql: string, fields: string[] = []): Promise<JiraIssue[]> {
    const response = await this.client.get('/rest/api/3/search', {
      params: {
        jql,
        fields: fields.join(','),
      },
    });

    return response.data.issues;
  }

  private mapPriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Highest',
    };

    return priorityMap[priority.toLowerCase()] || 'Medium';
  }
}

export default JiraService;
