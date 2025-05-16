import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, ProjectFile } from '../../types/project.types';
import { projectService } from '../../services/project.service';
import { Button } from '../common/Button';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showFiles, setShowFiles] = useState(false);

  const handleFetchFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await projectService.getProjectFiles(project.id);
      if (response.error) {
        throw new Error(response.error);
      }
      setFiles(response.data.files);
      setShowFiles(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const blob = await projectService.downloadFile(project.id, fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const handleCreateStory = () => {
    navigate(`/projects/${project.id}/stories/create`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          {project.description && (
            <p className="mt-1 text-sm text-gray-600">{project.description}</p>
          )}
        </div>
        {project.jira_id && (
          <a
            href={`https://your-jira-instance.com/browse/${project.jira_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {project.jira_id}
          </a>
        )}
      </div>

      <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
        <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
        <span>{project.fileCount || 0} files</span>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-3">
          <Button
            onClick={handleFetchFiles}
            isLoading={isLoading}
            variant={showFiles ? "secondary" : "primary"}
            className="px-3 py-1.5 text-sm"
          >
            {showFiles ? 'Hide Files' : 'Show Files'}
          </Button>
          <Button
            onClick={() => navigate(`/projects/${project.id}/stories`)}
            variant="secondary"
            className="px-3 py-1.5 text-sm"
          >
            View Stories
          </Button>
          <Button
            onClick={handleCreateStory}
            variant="primary"
            className="px-3 py-1.5 text-sm"
          >
            Create Story
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {showFiles && files.length > 0 && (
          <ul className="mt-4 divide-y divide-gray-200 rounded-md border border-gray-200">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between py-3 pl-3 pr-4 text-sm"
              >
                <div className="flex w-0 flex-1 items-center">
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-2 w-0 flex-1 truncate">{file.name}</span>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(file.id, file.name)}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {showFiles && files.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No files available
          </p>
        )}
      </div>
    </div>
  );
};