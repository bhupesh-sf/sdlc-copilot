import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // You might want to show a loading spinner here
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page with the attempted URL as state
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return <>{children}</>;
};

// HOC version for class components or when you prefer HOC syntax
export const withProtectedRoute = (
  WrappedComponent: React.ComponentType,
  redirectTo = '/login'
) => {
  return (props: any) => (
    <ProtectedRoute redirectTo={redirectTo}>
      <WrappedComponent {...props} />
    </ProtectedRoute>
  );
};