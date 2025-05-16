import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { BaseRepository } from './base.repository';

// Database types
type User = Database['public']['Tables']['users']['Row'];
type CreateUser = Database['public']['Tables']['users']['Insert'];
type UpdateUser = Database['public']['Tables']['users']['Update'];

// Type without password for safe return values
export type UserWithoutPassword = Omit<User, 'password'>;

// Internal entity type that includes all required fields
type UserEntity = User & BaseRepository.BaseEntity;

export class UserRepository extends BaseRepository<UserEntity> {
  // Default select fields (excludes password)
  protected readonly defaultSelect = 'id, email, full_name, avatar_url, created_at, updated_at';
  
  // Select all fields including password
  private readonly selectWithPassword = '*';
  
  /**
   * Find a user by ID (without password by default)
   */
  override async findById<U = UserWithoutPassword>(
    id: string, 
    includeAll = false
  ): Promise<U | null> {
    return super.findById<U>(id, includeAll);
  }
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'users');
  }

  /**
   * Find a user by email (without password by default)
   */
  async findByEmail<U = UserWithoutPassword>(
    email: string, 
    includePassword = false
  ): Promise<U | null> {
    const select = includePassword ? this.selectWithPassword : this.defaultSelect;
    const { data, error } = await this.table
      .select(select)
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as unknown as U;
  }

  /**
   * Create a new user profile (after auth user is created)
   */
  async createUser<U = UserWithoutPassword>(
    userData: CreateUser
  ): Promise<U> {
    const { data, error } = await this.table
      .insert(userData)
      .select(this.defaultSelect)
      .single();

    if (error) throw error;
    
    return data as unknown as U;
  }

  /**
   * Find a user by ID with password (for auth purposes)
   */
  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.findById<User>(id, true);
  }
  
  /**
   * Find a user by email with password (for auth purposes)
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.findByEmail<User>(email, true);
  }

  /**
   * Update a user's profile
   */
  async updateUser<U = UserWithoutPassword>(
    id: string, 
    updates: UpdateUser
  ): Promise<U> {
    // Handle null values for optional fields
    const updateData: Partial<UpdateUser> = { ...updates };
    
    // Ensure we don't accidentally set these to undefined
    if ('full_name' in updates) {
      updateData.full_name = updates.full_name ?? null;
    }
    if ('avatar_url' in updates) {
      updateData.avatar_url = updates.avatar_url ?? null;
    }
    
    const { data, error } = await this.table
      .update(updateData)
      .eq('id', id)
      .select(this.defaultSelect)
      .single();

    if (error) throw error;
    return data as unknown as U;
  }

  /**
   * Delete a user by ID
   * @param id The ID of the user to delete
   * @returns true if the user was deleted, false if not found
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      // First delete the auth user if it exists
      const { error: authError } = await this.supabase.auth.admin.deleteUser(id);
      
      // If the auth user doesn't exist, we'll still try to delete the profile
      if (authError && !authError.message.includes('User not found')) {
        throw authError;
      }
      
      // Then delete the user profile
      return await super.delete(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
