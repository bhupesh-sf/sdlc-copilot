import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Story } from '../types/story.types';
import { storyService } from '../services/story.service';
import { testCaseService } from '../services/testcase.service';
import { StoryCard } from '../components/stories/StoryCard';
import { Button } from '../components/common/Button';

export const Stories = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testCaseSummary, setTestCaseSummary] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (!projectId) return;
    fetchStories();
  }, [projectId]);
  
  useEffect(() => {
    if (stories.length > 0) {
      fetchTestCaseCounts();
    }
  }, [stories]);
  
  const fetchTestCaseCounts = async () => {
    const summary: {[key: string]: number} = {};
    
    // Fetch test case counts for each story
    await Promise.all(
      stories.map(async (story) => {
        try {
          const response = await testCaseService.getTestCasesByStory(story.id);
          if (response.data) {
            summary[story.id] = response.data.testCases.length;
          }
        } catch (error) {
          console.error(`Error fetching test cases for story ${story.id}:`, error);
        }
      })
    );
    
    setTestCaseSummary(summary);
  };

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await storyService.getStoriesByProject(projectId!);
      if (response.error) {
        throw new Error(response.error);
      }
      setStories(response.data.stories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStory = () => {
    navigate(`/projects/${projectId}/stories/create`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Stories</h1>
          <p className="text-gray-600 mt-1">
            {stories.length} {stories.length === 1 ? 'story' : 'stories'} •
            {Object.values(testCaseSummary).reduce((sum, count) => sum + count, 0)} test cases
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => navigate(`/projects/${projectId}/testcases`)}
            variant="outline"
            className="px-4 py-2"
          >
            View All Test Cases
          </Button>
          <Button
            onClick={handleCreateStory}
            variant="primary"
            className="px-4 py-2"
          >
            Create New Story
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600">
          {error}
        </div>
      )}

      {stories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No stories found for this project.</p>
          <Button
            onClick={handleCreateStory}
            variant="secondary"
            className="mt-4"
          >
            Create Your First Story
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} projectId={projectId!} />
          ))}
        </div>
      )}
    </div>
  );
};