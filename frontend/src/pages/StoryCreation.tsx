import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkflow } from '../context/workflow/WorkflowContext';
import { ChatContainer } from '../components/chat/ChatContainer';
import { projectService } from '../services/project.service';
import { CopilotKit } from '@copilotkit/react-core';

export const StoryCreation = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { state, setProject, nextStep, previousStep } = useWorkflow();

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        navigate('/projects');
        return;
      }
      
      try {
        const response = await projectService.getProject(projectId);
        if (response.error || !response.data) {
          throw new Error(response.error || 'Failed to fetch project');
        }
        setProject(response.data);
      } catch (error) {
        console.error('Error fetching project:', error);
        navigate('/projects');
      }
    };

    fetchProject();
  }, [projectId, navigate, setProject]);

  const handleComplete = () => {
    if (state.currentStep < state.steps.length - 1) {
      nextStep();
    } else {
      // In a real implementation, you would save the story to your backend here
      navigate(`/projects/${projectId}`);
    }
  };

  if (!state.project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <CopilotKit>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Create Story - {state.project.name}
          </h1>
          
          <div className="mt-4">
            <nav aria-label="Progress">
              <ol className="flex items-center">
                {state.steps.map((step, index) => (
                  <li
                    key={step.id}
                    className={`relative ${
                      index !== state.steps.length - 1 ? 'pr-8 sm:pr-20' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                          step.isCompleted
                            ? 'bg-blue-600'
                            : step.isActive
                            ? 'border-2 border-blue-600'
                            : 'border-2 border-gray-300'
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            step.isCompleted ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </div>
                      {index !== state.steps.length - 1 && (
                        <div
                          className={`absolute top-4 w-full h-0.5 ${
                            step.isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        />
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-sm font-medium">{step.title}</span>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>

        <div className="h-[600px]">
          <ChatContainer onComplete={handleComplete} />
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={previousStep}
            disabled={state.currentStep === 0}
            className={`px-4 py-2 rounded-md ${
              state.currentStep === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleComplete}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            {state.currentStep === state.steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </CopilotKit>
  );
};