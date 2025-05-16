import { Request, Response, NextFunction } from 'express';
import { JiraService } from '../services/jira.service';
import { TestCaseRepository } from '../repositories/testCase.repository';
import { supabase } from '../lib/supabase';
import { TestCase, TestCaseStatus } from '../types/testcase.types';

export class JiraController {
  public jiraService: JiraService;
  private testCaseRepo: TestCaseRepository;

  constructor() {
    this.testCaseRepo = new TestCaseRepository(supabase);
    
    // Initialize with default config (will be overridden by setConfig)
    this.jiraService = new JiraService({
      baseUrl: '',
      email: '',
      apiToken: '',
    });
  }

  setJiraConfig = (config: { baseUrl: string; email: string; apiToken: string }) => {
    this.jiraService = new JiraService({
      baseUrl: config.baseUrl,
      email: config.email,
      apiToken: config.apiToken,
    });
  };

  // Middleware to check if JIRA is configured
  checkJiraConfig = (req: Request, res: Response, next: NextFunction) => {
    if (!this.jiraService) {
      res.status(400).json({ error: 'JIRA configuration is missing' });
      return;
    }
    next();
  };

  // Configure JIRA credentials
  configureJira = async (req: Request, res: Response): Promise<void> => {
    try {
      const { baseUrl, email, apiToken } = req.body;
      
      if (!baseUrl || !email || !apiToken) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      this.setJiraConfig({ baseUrl, email, apiToken });
      
      // Test the connection
      await this.jiraService.getIssue('META-1');
      
      res.json({ success: true, message: 'JIRA configuration saved successfully' });
    } catch (error: any) {
      console.error('Error configuring JIRA:', error);
      res.status(500).json({ 
        error: 'Failed to configure JIRA', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  // Sync test case to JIRA
  syncTestCase = async (req: Request, res: Response): Promise<void> => {
    try {
      const { testCaseId } = req.params;
      const { projectId } = req.body;
      
      if (!projectId) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      const testCase = await this.testCaseRepo.findById(testCaseId);
      if (!testCase) {
        res.status(404).json({ error: 'Test case not found' });
        return;
      }

      // Convert database model to TestCase type
      const testCaseData: TestCase = {
        id: testCase.id,
        storyId: testCase.story_id,
        title: testCase.title,
        description: testCase.description,
        steps: testCase.steps,
        expectedResult: testCase.expected_result || '',
        status: testCase.status as TestCaseStatus,
        priority: testCase.priority as 'low' | 'medium' | 'high' | 'critical',
        createdBy: testCase.created_by,
        createdAt: testCase.created_at,
        updatedAt: testCase.updated_at,
        jiraId: testCase.jira_id || undefined,
        preconditions: testCase.preconditions || undefined,
        postconditions: testCase.postconditions || undefined,
      };

      const jiraIssue = await this.jiraService.createTestIssue(testCaseData, projectId);
      
      if (!jiraIssue.key) {
        throw new Error('Failed to get JIRA issue key');
      }
      
      // Update test case with JIRA issue ID
      const updated = await this.testCaseRepo.update(testCaseId, { 
        jira_id: jiraIssue.key,
      });
      
      if (!updated) {
        throw new Error('Failed to update test case with JIRA key');
      }
      
      res.json({
        success: true,
        jiraIssue,
        testCaseId: testCase.id,
      });
    } catch (error: any) {
      console.error('Error syncing test case to JIRA:', error);
      res.status(500).json({ 
        error: 'Failed to sync test case to JIRA', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  // Get JIRA issue by key
  getIssue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { issueKey } = req.params;
      const issue = await this.jiraService.getIssue(issueKey);
      res.json(issue);
    } catch (error: any) {
      console.error('Error fetching JIRA issue:', error);
      res.status(500).json({ 
        error: 'Failed to fetch JIRA issue', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  // Search JIRA issues
  searchIssues = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jql, fields } = req.query;
      
      if (!jql) {
        res.status(400).json({ error: 'JQL query is required' });
        return;
      }

      const fieldList = typeof fields === 'string' ? fields.split(',') : [];
      const issues = await this.jiraService.getIssuesByJql(jql as string, fieldList);
      
      res.json(issues);
    } catch (error: any) {
      console.error('Error searching JIRA issues:', error);
      res.status(500).json({ 
        error: 'Failed to search JIRA issues', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  // Add comment to JIRA issue
  addComment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { issueKey } = req.params;
      const { comment } = req.body;
      
      if (!comment) {
        res.status(400).json({ error: 'Comment is required' });
        return;
      }

      await this.jiraService.addComment(issueKey, comment);
      res.json({ success: true, message: 'Comment added successfully' });
    } catch (error: any) {
      console.error('Error adding comment to JIRA issue:', error);
      res.status(500).json({ 
        error: 'Failed to add comment to JIRA issue', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };
}

export const jiraController = new JiraController();
