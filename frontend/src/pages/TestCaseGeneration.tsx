import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CopilotKit } from '@copilotkit/react-core';
import { WorkflowProvider, useWorkflow } from '../context/workflow/WorkflowContext';
import { TestCaseGenerationForm } from '../components/testcases/TestCaseGenerationForm';
import { WorkflowStatus } from '../components/testcases/WorkflowStatus';
import { TestCaseList } from '../components/testcases/TestCaseList';
import { TestCase } from '../types/testcase.types';

// Wrapper component to use the WorkflowContext
const TestCaseGenerationContent = () => {
  const { storyId, projectId } = useParams<{ storyId?: string; projectId: string }>();
  const navigate = useNavigate();
  const { state } = useWorkflow();
  
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [workflowCompleted, setWorkflowCompleted] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [allStoryTestCases, setAllStoryTestCases] = useState<{[key: string]: TestCase[]}>({});
  const [isLoading, setIsLoading] = useState(false);

  // If we're in project-wide test case view (no specific story)
  const isProjectView = !storyId;
  
  useEffect(() => {
    if (isProjectView) {
      fetchAllProjectTestCases();
    }
  }, [projectId, isProjectView]);
  
  const fetchAllProjectTestCases = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      // This would need a backend endpoint to get all test cases for a project
      // For now, we'll just show a placeholder
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching project test cases:', error);
      setIsLoading(false);
    }
  };

  const handleGenerationStart = (workflowId: string) => {
    setActiveWorkflowId(workflowId);
    setWorkflowCompleted(false);
  };

  const handleWorkflowComplete = (success: boolean) => {
    setWorkflowCompleted(success);
  };

  const handleSelectTestCase = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isProjectView ? "Project Test Cases" : "Test Case Generation"}
        </h1>
        <p className="mt-2 text-gray-600">
          {isProjectView
            ? "View and manage all test cases for this project"
            : "Generate comprehensive test cases for your user stories using AI"}
        </p>
        
        {isProjectView && (
          <button
            onClick={() => navigate(`/projects/${projectId}/stories`)}
            className="mt-2 text-blue-600 hover:text-blue-800 flex items-center"
          >
            <span className="mr-1">←</span> Back to Stories
          </button>
        )}
        
        {!isProjectView && (
          <button
            onClick={() => navigate(`/projects/${projectId}/stories`)}
            className="mt-2 text-blue-600 hover:text-blue-800 flex items-center"
          >
            <span className="mr-1">←</span> Back to Story
          </button>
        )}
      </div>

      {isProjectView ? (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">All Test Cases</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                This view will show all test cases across stories for this project.
              </p>
              {/* Project-wide test case view would go here */}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Test case generation form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Generate Test Cases
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Provide story details to generate test cases
                </p>
              </div>
              <div className="h-[600px]">
                <TestCaseGenerationForm
                  storyId={storyId!}
                  onGenerationStart={handleGenerationStart}
                />
              </div>
            </div>
          </div>

        {/* Right column - Workflow status and test case list */}
        <div className="space-y-6">
          {activeWorkflowId && (
            <WorkflowStatus 
              workflowId={activeWorkflowId} 
              onComplete={handleWorkflowComplete}
            />
          )}

          {workflowCompleted && (
            <TestCaseList 
              storyId={storyId} 
              onSelectTestCase={handleSelectTestCase}
            />
          )}

          {selectedTestCase && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedTestCase.title}
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Description</h4>
                  <p className="mt-1 text-sm text-gray-600">{selectedTestCase.description}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Steps</h4>
                  <ul className="mt-1 space-y-2">
                    {selectedTestCase.steps.map((step, index) => (
                      <li key={index} className="text-sm">
                        <div className="font-medium">Step {index + 1}: {step.action}</div>
                        <div className="text-gray-600">Expected: {step.expected}</div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Expected Result</h4>
                  <p className="mt-1 text-sm text-gray-600">{selectedTestCase.expectedResult}</p>
                </div>
                
                {selectedTestCase.preconditions && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Preconditions</h4>
                    <p className="mt-1 text-sm text-gray-600">{selectedTestCase.preconditions}</p>
                  </div>
                )}
                
                {selectedTestCase.postconditions && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Postconditions</h4>
                    <p className="mt-1 text-sm text-gray-600">{selectedTestCase.postconditions}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

// Main component with CopilotKit and WorkflowProvider
export const TestCaseGeneration = () => {
  return (
    <CopilotKit>
      <WorkflowProvider>
        <TestCaseGenerationContent />
      </WorkflowProvider>
    </CopilotKit>
  );
};

export default TestCaseGeneration;