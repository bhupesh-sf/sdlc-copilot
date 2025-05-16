import { Request, Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/config';
import { DatabaseService } from '../services/database.service';
import { BadRequestException, UnauthorizedException } from '../middleware/error.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export class AuthController {
  private supabase: SupabaseClient;

  constructor(private db: DatabaseService) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  }

  async register(req: Request, res: Response) {
    const { email, password, full_name } = req.body;

    try {
      // Check if user already exists
      const existingUser = await this.db.users.findByEmail(email);
      if (existingUser) {
        throw new BadRequestException('User already exists with this email');
      }

      // Create user with Supabase Auth
      const { data: authData, error: signUpError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('User creation failed');

      // Sign in to get session
      const { data: { session }, error: signInError } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!session) throw new Error('Session creation failed');

      // Get user from database
      const user = await this.db.users.findById(authData.user.id);
      if (!user) {
        throw new Error('User profile not found');
      }

      // Remove sensitive data from response
      const { password: _, ...userWithoutPassword } = user;

      return { 
        user: userWithoutPassword, 
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new BadRequestException(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      // Sign in with Supabase Auth
      const { data: { user, session }, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!user || !session) throw new UnauthorizedException('Invalid credentials');

      // Get user from database
      const dbUser = await this.db.users.findById(user.id);
      if (!dbUser) {
        throw new UnauthorizedException('User not found');
      }

      // Remove sensitive data from response
      const { password: _, ...userWithoutPassword } = dbUser;

      return { 
        user: userWithoutPassword, 
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException(error instanceof Error ? error.message : 'Invalid credentials');
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('Not authenticated');
      }

      // Get user from database
      const user = await this.db.users.findById(req.user.id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Remove sensitive data from response
      const { password, ...userWithoutPassword } = user;
      return { user: userWithoutPassword };
    } catch (error) {
      console.error('Get current user error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async refreshToken(req: Request, res: Response) {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      const { data: { session, user }, error } = await this.supabase.auth.refreshSession({
        refresh_token,
      });

      if (error || !session || !user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: {
          id: user.id,
          email: user.email,
          // Add other user fields as needed
        }
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new UnauthorizedException('Failed to refresh token');
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  }
}

export default AuthController;
