import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCopilotAction } from '@copilotkit/react-core';
import { CopilotSidebar, InputProps } from '@copilotkit/react-ui';
import { useWorkflow } from '../../context/workflow/WorkflowContext';
import { Button } from '../common/Button';
import { testCaseService } from '../../services/testcase.service';
import '@copilotkit/react-ui/styles.css';

interface TestCaseGenerationFormProps {
  storyId: string;
  onGenerationStart: (workflowId: string) => void;
}

export const TestCaseGenerationForm = ({
  storyId,
  onGenerationStart
}: TestCaseGenerationFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const {
    state,
    addMessage,
    addAttachment,
    removeAttachment
  } = useWorkflow();

  // Register the test case generation action
  useCopilotAction({
    name: 'generate-test-cases',
    description: 'Generate test cases for a user story',
    parameters: [
      {
        name: 'storyId',
        type: 'string',
        description: 'The story ID to generate test cases for',
        required: true,
      },
      {
        name: 'title',
        type: 'string',
        description: 'Title of the user story',
        required: true,
      },
      {
        name: 'description',
        type: 'string',
        description: 'Description of the user story',
        required: true,
      },
      {
        name: 'acceptanceCriteria',
        type: 'string[]',
        description: 'List of acceptance criteria',
        required: true,
      },
    ],
    handler: async (params) => {
      try {
        // Call the test case generation API
        const response = await testCaseService.generateTestCases(params.storyId, {
          content: {
            title: params.title,
            description: params.description,
            acceptanceCriteria: params.acceptanceCriteria,
          }
        });

        if (response.error || !response.data) {
          return `Error: ${response.error || 'Failed to generate test cases'}`;
        }

        // Trigger the workflow status tracking
        onGenerationStart(response.data.workflowId);
        return 'Test case generation started successfully. You can track the progress in the workflow status panel.';
      } catch (error) {
        console.error('Error generating test cases:', error);
        return 'An unexpected error occurred while generating test cases.';
      }
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      await addAttachment(files[0]);
      addMessage({
        content: `File attached: ${files[0].name}`,
        role: 'user',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  // Custom input component for the sidebar
  const CustomInput: React.FC<InputProps> = ({ inProgress, onSend, isVisible = true }) => (
    <div className={`flex items-center space-x-2 p-4 ${isVisible ? '' : 'hidden'}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
      <Button
        onClick={handleAttachFile}
        variant="secondary"
        className="px-3 py-1.5"
      >
        Attach File
      </Button>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !inProgress) {
            onSend(inputValue);
            setInputValue('');
          }
        }}
        placeholder="Type your message..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={inProgress}
      />
      <Button
        onClick={() => {
          onSend(inputValue);
          setInputValue('');
        }}
        variant="primary"
        className="px-3 py-1.5"
        disabled={inProgress || !inputValue.trim()}
      >
        Send
      </Button>
    </div>
  );

  // Custom messages component for the sidebar
  const CustomMessages = ({ messages }: { messages: any[] }) => (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {state.messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[70%] rounded-lg p-3 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {message.content}
          </div>
        </div>
      ))}

      <div className="flex space-x-2 mb-2">
        {state.attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center bg-gray-100 rounded px-2 py-1 text-sm"
          >
            <span className="truncate max-w-[150px]">{attachment.name}</span>
            <button
              onClick={() => removeAttachment(attachment.id)}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <CopilotSidebar
      defaultOpen={true}
      Input={CustomInput}
      Messages={CustomMessages}
      instructions="You are a test case generation assistant. Help the user create comprehensive test cases for their user story. Ask about the story details, acceptance criteria, and any specific testing requirements."
      labels={{
        title: "Test Case Generation Assistant",
        initial: "Let's generate test cases for your user story. Please provide details about the story, or I can help you extract them from your requirements.",
        placeholder: "Describe your user story or requirements...",
      }}
    />
  );
};