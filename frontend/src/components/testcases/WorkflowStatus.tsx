import { useEffect, useState } from 'react';
import { testCaseService } from '../../services/testcase.service';
import { TestCaseWorkflowStatus } from '../../types/testcase.types';

interface WorkflowStatusProps {
  workflowId: string;
  onComplete?: (success: boolean) => void;
  pollingInterval?: number;
}

export const WorkflowStatus = ({
  workflowId,
  onComplete,
  pollingInterval = 5000,
}: WorkflowStatusProps) => {
  const [status, setStatus] = useState<TestCaseWorkflowStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    let intervalId: number;

    const fetchStatus = async () => {
      try {
        const response = await testCaseService.getWorkflowStatus(workflowId);
        
        if (response.error) {
          setError(response.error);
          setIsPolling(false);
          if (onComplete) onComplete(false);
          return;
        }

        if (response.data) {
          setStatus(response.data);
          
          // Check if workflow is completed or failed
          if (response.data.status === 'completed' || response.data.status === 'failed') {
            setIsPolling(false);
            if (onComplete) onComplete(response.data.status === 'completed');
          }
        }
      } catch (err) {
        console.error('Error fetching workflow status:', err);
        setError('Failed to fetch workflow status');
        setIsPolling(false);
        if (onComplete) onComplete(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up polling if needed
    if (isPolling) {
      intervalId = setInterval(fetchStatus, pollingInterval);
    }

    // Clean up
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [workflowId, isPolling, pollingInterval, onComplete]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
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

  if (!status) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <p className="text-center mt-2 text-gray-600">Initializing workflow...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="h-5 w-5 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${getStatusColor(status.status)}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {getStatusIcon(status.status)}
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">
            Workflow Status: {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
          </h3>
          {status.message && (
            <div className="mt-2 text-sm">
              <p>{status.message}</p>
            </div>
          )}
          {status.currentStep && (
            <div className="mt-2 text-sm">
              <p>Current step: {status.currentStep}</p>
            </div>
          )}
        </div>
      </div>
      
      {status.progress !== undefined && (
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-800">
                  Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-800">
                  {status.progress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div
                style={{ width: `${status.progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};