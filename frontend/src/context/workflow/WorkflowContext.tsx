import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Project } from '../../types/project.types';
import { WorkflowState, WorkflowContextType, ChatMessage, FileAttachment } from '../../types/workflow.types';

const initialSteps = [
  {
    id: 'requirements',
    title: 'Requirements',
    description: 'Define story requirements and acceptance criteria',
    isCompleted: false,
    isActive: true,
  },
  {
    id: 'details',
    title: 'Story Details',
    description: 'Provide additional story details and context',
    isCompleted: false,
    isActive: false,
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review and confirm story details',
    isCompleted: false,
    isActive: false,
  },
];

const initialState: WorkflowState = {
  currentStep: 0,
  steps: initialSteps,
  project: null,
  messages: [],
  attachments: [],
};

type Action =
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SET_PROJECT'; payload: Project }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'ADD_ATTACHMENT'; payload: FileAttachment }
  | { type: 'REMOVE_ATTACHMENT'; payload: string };

const workflowReducer = (state: WorkflowState, action: Action): WorkflowState => {
  switch (action.type) {
    case 'NEXT_STEP': {
      if (state.currentStep >= state.steps.length - 1) return state;
      
      const updatedSteps = state.steps.map((step, index) => ({
        ...step,
        isCompleted: index <= state.currentStep,
        isActive: index === state.currentStep + 1,
      }));

      return {
        ...state,
        currentStep: state.currentStep + 1,
        steps: updatedSteps,
      };
    }

    case 'PREVIOUS_STEP': {
      if (state.currentStep <= 0) return state;

      const updatedSteps = state.steps.map((step, index) => ({
        ...step,
        isCompleted: index < state.currentStep - 1,
        isActive: index === state.currentStep - 1,
      }));

      return {
        ...state,
        currentStep: state.currentStep - 1,
        steps: updatedSteps,
      };
    }

    case 'SET_PROJECT':
      return {
        ...state,
        project: action.payload,
      };

    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case 'ADD_ATTACHMENT':
      return {
        ...state,
        attachments: [...state.attachments, action.payload],
      };

    case 'REMOVE_ATTACHMENT':
      return {
        ...state,
        attachments: state.attachments.filter(
          (attachment) => attachment.id !== action.payload
        ),
      };

    default:
      return state;
  }
};

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  const nextStep = () => dispatch({ type: 'NEXT_STEP' });
  const previousStep = () => dispatch({ type: 'PREVIOUS_STEP' });
  const setProject = (project: Project) =>
    dispatch({ type: 'SET_PROJECT', payload: project });

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: newMessage });
  };

  const addAttachment = async (file: File) => {
    // In a real implementation, you would upload the file to a server here
    const attachment: FileAttachment = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    };
    dispatch({ type: 'ADD_ATTACHMENT', payload: attachment });
  };

  const removeAttachment = (id: string) => {
    dispatch({ type: 'REMOVE_ATTACHMENT', payload: id });
  };

  return (
    <WorkflowContext.Provider
      value={{
        state,
        nextStep,
        previousStep,
        setProject,
        addMessage,
        addAttachment,
        removeAttachment,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};