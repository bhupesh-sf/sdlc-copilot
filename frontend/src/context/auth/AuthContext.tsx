import { createContext, useContext } from 'react';
import { AuthContextType } from '../../types/auth.types';

// Create context with a default value matching AuthContextType
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {
    throw new Error('AuthContext not initialized');
  },
  register: async () => {
    throw new Error('AuthContext not initialized');
  },
  logout: async () => {
    throw new Error('AuthContext not initialized');
  },
  clearError: () => {
    throw new Error('AuthContext not initialized');
  },
});

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};