import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { LoginCredentials, RegisterCredentials, TokenResponse, User } from '../types/auth.types';
import { getAccessToken, getRefreshToken, storeTokens } from '../utils/token.utils';

class AuthService {
  private api: AxiosInstance;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: '/api', // Will be configured in Vite for proxy
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Token refresh failed, user needs to login again
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string | null> {
    // Ensure we only make one refresh request at a time
    if (!this.refreshPromise) {
      this.refreshPromise = this.performTokenRefresh();
    }

    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async performTokenRefresh(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await this.api.post<TokenResponse>('/refresh-token', {
        refresh_token: refreshToken,
      });

      storeTokens(response.data);
      return response.data.access_token;
    } catch (error) {
      return null;
    }
  }

  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const response = await this.api.post<TokenResponse>('/login', credentials);
    storeTokens(response.data);
    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<TokenResponse> {
    const response = await this.api.post<TokenResponse>('/register', credentials);
    storeTokens(response.data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<{ user: User }>('/me');
    return response.data.user;
  }

  async logout(): Promise<void> {
    await this.api.post('/logout');
  }
}

// Export a singleton instance
export const authService = new AuthService();