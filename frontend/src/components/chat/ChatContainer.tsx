import { useRef, useState } from 'react';
import { CopilotSidebar, InputProps } from '@copilotkit/react-ui';
import { useCopilotAction } from '@copilotkit/react-core';
import { useWorkflow } from '../../context/workflow/WorkflowContext';
import { Button } from '../common/Button';
import '@copilotkit/react-ui/styles.css';

interface ChatContainerProps {
  onComplete?: () => void;
}

export const ChatContainer = ({ onComplete }: ChatContainerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const {
    state,
    addMessage,
    addAttachment,
    removeAttachment
  } = useWorkflow();

  // Register the story workflow action
  useCopilotAction({
    name: 'story-workflow',
    description: 'Trigger the story creation workflow',
    parameters: [
      {
        name: 'projectId',
        type: 'string',
        description: 'The project ID to associate with this story',
        required: true,
      },
      {
        name: 'title',
        type: 'string',
        description: 'Brief title of the user story',
        required: true,
      },
      {
        name: 'description',
        type: 'string',
        description: 'Detailed description of the feature',
        required: true,
      },
      {
        name: 'businessValue',
        type: 'string',
        description: 'Why this story is important',
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
      // In a real implementation, this would call your backend API
      console.log('Story workflow triggered with params:', params);
      return 'Story workflow started successfully';
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
      {onComplete && (
        <Button
          onClick={onComplete}
          variant="primary"
          className="px-3 py-1.5"
        >
          Complete
        </Button>
      )}
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
      instructions="You are a story creation assistant. Help the user create a well-defined user story with clear requirements and acceptance criteria."
      labels={{
        title: "Story Creation Assistant",
        initial: "Let's create a new user story. What feature would you like to implement?",
        placeholder: "Describe the feature you want to implement...",
      }}
    />
  );
};