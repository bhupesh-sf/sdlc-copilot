import { useAuth } from '../context/auth/AuthContext';
import { Button } from '../components/common/Button';

export const DashboardPage = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-medium text-gray-900">Welcome!</h2>
            <p className="mt-2 text-gray-600">
              You are logged in as {user?.full_name} ({user?.email})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;