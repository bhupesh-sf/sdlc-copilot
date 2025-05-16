import { TokenResponse } from '../types/auth.types';

const TOKEN_KEY = 'auth_tokens';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export const storeTokens = (response: TokenResponse): void => {
  const tokens: StoredTokens = {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: response.expires_at,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
};

export const getStoredTokens = (): StoredTokens | null => {
  const tokensStr = localStorage.getItem(TOKEN_KEY);
  if (!tokensStr) return null;
  
  try {
    return JSON.parse(tokensStr) as StoredTokens;
  } catch {
    return null;
  }
};

export const removeTokens = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isTokenExpired = (expiresAt: number): boolean => {
  // Add a 5-minute buffer to ensure we refresh before actual expiration
  const bufferMs = 5 * 60 * 1000;
  return Date.now() >= (expiresAt - bufferMs);
};

export const getAccessToken = (): string | null => {
  const tokens = getStoredTokens();
  if (!tokens) return null;
  
  if (isTokenExpired(tokens.expiresAt)) {
    return null;
  }
  
  return tokens.accessToken;
};

export const getRefreshToken = (): string | null => {
  const tokens = getStoredTokens();
  return tokens?.refreshToken || null;
};