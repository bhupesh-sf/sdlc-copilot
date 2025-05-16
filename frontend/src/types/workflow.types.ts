import { Project } from './project.types';

export type WorkflowStep = {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
};

export type WorkflowState = {
  currentStep: number;
  steps: WorkflowStep[];
  project: Project | null;
  messages: ChatMessage[];
  attachments: FileAttachment[];
};

export type ChatMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

export type FileAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
};

export type WorkflowContextType = {
  state: WorkflowState;
  nextStep: () => void;
  previousStep: () => void;
  setProject: (project: Project) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  addAttachment: (file: File) => Promise<void>;
  removeAttachment: (id: string) => void;
};