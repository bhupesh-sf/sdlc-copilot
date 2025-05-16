import { useState, useRef, ChangeEvent } from 'react';
import { useForm } from '../../hooks/useForm';
import { projectValidation } from '../../utils/validation.utils';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { Button } from '../common/Button';
import { ProjectFormData, CreateProjectWithFilesDTO } from '../../types/project.types';
import { projectService } from '../../services/project.service';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FormValues = {
  name: string;
  description: string;
  jira_id: string;
  files: File[];
};

const initialValues: FormValues = {
  name: '',
  description: '',
  jira_id: '',
  files: [],
};

export const CreateProjectModal = ({ isOpen, onClose, onSuccess }: CreateProjectModalProps) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
  } = useForm<FormValues>({
    initialValues,
    validationSchema: projectValidation,
    onSubmit: async (formValues) => {
      try {
        const projectData: CreateProjectWithFilesDTO = {
          name: formValues.name,
          description: formValues.description || undefined,
          jira_id: formValues.jira_id || undefined,
          files: formValues.files,
        };

        const response = await projectService.createProject(projectData);
        
        if (response.error) {
          throw new Error(response.error);
        }

        onSuccess();
        onClose();
      } catch (error) {
        console.error('Failed to create project:', error);
        throw error;
      }
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    setFieldValue('files', [...values.files, ...newFiles]);
    newFiles.forEach(file => {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
    });
  };

  const removeFile = (fileName: string) => {
    setFieldValue(
      'files',
      values.files.filter(file => file.name !== fileName)
    );
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl transform rounded-xl bg-white p-6 shadow-xl transition-all">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Create New Project</h3>
            <p className="mt-1 text-sm text-gray-600">Fill in the project details and upload any relevant files.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Project Name"
              name="name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              required
            />

            <TextArea
              label="Description"
              name="description"
              value={values.description}
              onChange={handleChange as unknown as (e: ChangeEvent<HTMLTextAreaElement>) => void}
              onBlur={handleBlur as unknown as (e: ChangeEvent<HTMLTextAreaElement>) => void}
              error={errors.description}
            />

            <Input
              label="Jira ID"
              name="jira_id"
              value={values.jira_id}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.jira_id}
              placeholder="PROJECT-123"
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Files</label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors
                  ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                />

                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 14v20c0 4.418 3.582 8 8 8h16c4.418 0 8-3.582 8-8V14M8 14c0-4.418 3.582-8 8-8h16c4.418 0 8 3.582 8 8M8 14h32"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <button
                      type="button"
                      className="font-medium text-blue-600 hover:text-blue-500"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload files
                    </button>{' '}
                    or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Any file type up to 10MB</p>
                </div>
              </div>

              {values.files.length > 0 && (
                <ul className="mt-4 divide-y divide-gray-200 rounded-md border border-gray-200">
                  {values.files.map((file) => (
                    <li key={file.name} className="flex items-center justify-between py-3 pl-3 pr-4 text-sm">
                      <div className="flex w-0 flex-1 items-center">
                        <span className="ml-2 w-0 flex-1 truncate">{file.name}</span>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => removeFile(file.name)}
                          className="font-medium text-red-600 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {errors.submit && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
              >
                Create Project
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};