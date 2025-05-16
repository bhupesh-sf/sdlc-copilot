import { useState, useEffect } from 'react';
import { testCaseService } from '../../services/testcase.service';
import { TestCase, TestCaseStatus, TestCasePriority } from '../../types/testcase.types';

interface TestCaseListProps {
  storyId: string;
  onSelectTestCase?: (testCase: TestCase) => void;
}

export const TestCaseList = ({ storyId, onSelectTestCase }: TestCaseListProps) => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestCases = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await testCaseService.getTestCasesByStory(storyId);
        
        if (response.error) {
          setError(response.error);
        } else if (response.data) {
          setTestCases(response.data.testCases);
        }
      } catch (err) {
        setError('Failed to fetch test cases');
        console.error('Error fetching test cases:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestCases();
  }, [storyId]);

  const getStatusBadgeColor = (status: TestCaseStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'ready_for_review':
        return 'bg-blue-100 text-blue-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: TestCasePriority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (testCases.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No test cases</h3>
        <p className="mt-1 text-sm text-gray-500">
          No test cases have been generated for this story yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Test Cases</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {testCases.length} test cases generated for this story
        </p>
      </div>
      <ul className="divide-y divide-gray-200">
        {testCases.map((testCase) => (
          <li 
            key={testCase.id} 
            className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer transition duration-150"
            onClick={() => onSelectTestCase && onSelectTestCase(testCase)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-blue-600 truncate">{testCase.title}</h4>
                <p className="mt-1 text-sm text-gray-500 truncate">{testCase.description}</p>
              </div>
              <div className="ml-4 flex-shrink-0 flex space-x-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(testCase.status)}`}>
                  {testCase.status.replace('_', ' ')}
                </span>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(testCase.priority)}`}>
                  {testCase.priority}
                </span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Steps:</span> {testCase.steps.length}
              </div>
              {testCase.jiraId && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Jira ID:</span> {testCase.jiraId}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};