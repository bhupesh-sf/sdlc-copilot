import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Story } from '../../types/story.types';
import { Button } from '../common/Button';
import { testCaseService } from '../../services/testcase.service';

interface StoryCardProps {
  story: Story;
  projectId: string;
}

export const StoryCard = ({ story, projectId }: StoryCardProps) => {
  const navigate = useNavigate();
  const [testCaseCount, setTestCaseCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    fetchTestCases();
  }, [story.id]);
  
  const fetchTestCases = async () => {
    try {
      setIsLoading(true);
      const response = await testCaseService.getTestCasesByStory(story.id);
      if (response.data) {
        setTestCaseCount(response.data.testCases.length);
      }
    } catch (error) {
      console.error('Error fetching test cases:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const getStatusColor = (status: Story['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_review':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{story.title}</h3>
          {story.description && (
            <p className="mt-1 text-sm text-gray-600">{story.description}</p>
          )}
        </div>
        {story.jira_id && (
          <a
            href={`https://your-jira-instance.com/browse/${story.jira_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {story.jira_id}
          </a>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(story.status)}`}>
          {story.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-700">Business Value</h4>
          <p className="mt-1 text-sm text-gray-600">{story.business_value}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700">Acceptance Criteria</h4>
          <p className="mt-1 text-sm text-gray-600">{story.acceptance_criteria}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center">
          {isLoading ? (
            <span className="text-sm text-gray-500">Loading test cases...</span>
          ) : (
            <span className="text-sm text-gray-600">
              {testCaseCount > 0 ? (
                <span className="flex items-center">
                  <span className="font-medium">{testCaseCount}</span>
                  <span className="ml-1">test case{testCaseCount !== 1 ? 's' : ''}</span>
                  <Button
                    variant="outline"
                    className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs"
                    onClick={() => navigate(`/projects/${projectId}/stories/${story.id}/testcases`)}
                  >
                    View
                  </Button>
                </span>
              ) : (
                <span className="text-gray-500">No test cases</span>
              )}
            </span>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-sm"
          >
            Edit
          </Button>
          
          <Button
            variant="primary"
            className="px-3 py-1.5 text-sm"
            onClick={() => navigate(`/projects/${projectId}/stories/${story.id}/testcases`)}
          >
            Generate Test Cases
          </Button>
        </div>
      </div>
    </div>
  );
};