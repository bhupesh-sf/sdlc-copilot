import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import { Projects as ProjectsPage } from './pages/Projects';
import { Stories as StoriesPage } from './pages/Stories';
import { StoryCreation as StoryCreationPage } from './pages/StoryCreation';
import { TestCaseGeneration as TestCaseGenerationPage } from './pages/TestCaseGeneration';

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/stories/create"
            element={
              <ProtectedRoute>
                <StoryCreationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/stories"
            element={
              <ProtectedRoute>
                <StoriesPage />
              </ProtectedRoute>
            }
          />

          {/* Test case routes */}
          <Route
            path="/projects/:projectId/stories/:storyId/testcases"
            element={
              <ProtectedRoute>
                <TestCaseGenerationPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/projects/:projectId/testcases"
            element={
              <ProtectedRoute>
                <TestCaseGenerationPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;