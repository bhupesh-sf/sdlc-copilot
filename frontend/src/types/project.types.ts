export interface Project {
  id: string;
  name: string;
  description: string | null;
  jira_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  fileCount?: number;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  content: string;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Base DTO for creating a project without files
export interface CreateProjectDTO {
  name: string;
  description?: string;
  jira_id?: string;
}

// Extended DTO that includes files for the full create operation
export interface CreateProjectWithFilesDTO extends CreateProjectDTO {
  files: File[];
}

// Form data structure matching the form fields
export interface ProjectFormData extends CreateProjectWithFilesDTO {}

export interface UploadProgressEvent {
  fileName: string;
  progress: number;
}

export interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: Record<string, number>;
}

// API Response Types
export interface APIResponse<T> {
  data: T;
  error: string | null;
}

export interface ProjectsResponse extends APIResponse<{
  projects: Project[];
}> {}

export interface ProjectResponse extends APIResponse<Project | null> {}

export interface ProjectFilesResponse extends APIResponse<{
  files: ProjectFile[];
}> {}