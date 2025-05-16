import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Type to make all fields non-nullable except for explicitly optional ones
type NonNullableFields<T> = {
  [P in keyof T]: null extends T[P] ? T[P] : NonNullable<T[P]>;
};

// Type to exclude auto-generated fields from create/update operations
type ExcludeAutoFields<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

// Base entity type that all database entities should extend
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Export a namespace to contain related types
export namespace BaseRepository {
  // This allows us to reference BaseRepository.BaseEntity in other files
  export type BaseEntity = {
    id: string;
    created_at: string;
    updated_at: string;
  };
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected abstract readonly defaultSelect: string;
  
  constructor(
    protected readonly supabase: SupabaseClient<Database>,
    protected readonly tableName: keyof Database['public']['Tables']
  ) {}
  
  /**
   * Get the select string based on the include flag
   */
  protected getSelect(includeAll = false): string {
    return includeAll ? '*' : this.defaultSelect;
  }

  protected get table() {
    return this.supabase.from(this.tableName);
  }

  protected handleError(error: PostgrestError | null): void {
    if (error) {
      throw error;
    }
  }

  protected isNotFoundError(error: PostgrestError): boolean {
    return error.code === 'PGRST116' || error.code === '22P02'; // Not found or invalid UUID
  }

  async findById<U = T>(id: string, includeAll = false): Promise<U | null> {
    const select = this.getSelect(includeAll);
    const { data, error } = await this.table
      .select(select)
      .eq('id', id)
      .single();

    if (error) {
      if (this.isNotFoundError(error)) return null;
      throw error;
    }

    return data as unknown as U;
  }

  async findAll(
    filters: Partial<Record<keyof T, unknown>> = {}, 
    includeAll = false
  ): Promise<T[]> {
    const select = this.getSelect(includeAll);
    let query = this.table.select(select);

    // Filter out undefined values and convert to non-nullable
    const cleanFilters = Object.entries(filters).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    try {
      // Apply filters
      Object.entries(cleanFilters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query;

      if (error) {
        if (this.isNotFoundError(error)) return [];
        throw error;
      }

      // Safe type assertion as we control the select statement
      return (data || []) as unknown as T[];
    } catch (error) {
      // Handle any unexpected errors
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  /**
   * Create a new record in the database
   * @param data The data to create the record with
   * @returns The created record
   */
  async create(
    data: ExcludeAutoFields<Partial<NonNullableFields<T>>>
  ): Promise<T> {
    const now = new Date().toISOString();
    const record = {
      ...data,
      created_at: now,
      updated_at: now,
    };

    const { data: result, error } = await this.table
      .insert(record as any)
      .select()
      .single();

    this.handleError(error);
    return result as unknown as T;
  }

  /**
   * Update an existing record in the database
   * @param id The ID of the record to update
   * @param updates The fields to update
   * @returns The updated record
   */
  async update(
    id: string,
    updates: Partial<ExcludeAutoFields<NonNullableFields<T>>>
  ): Promise<T> {
    const now = new Date().toISOString();
    const updateData = {
      ...updates,
      updated_at: now,
    };

    const { data: result, error } = await this.table
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single();

    this.handleError(error);
    return result as unknown as T;
  }

  /**
   * Delete a record by ID
   * @returns true if the record was deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await this.table
      .delete()
      .eq('id', id);
    
    if (error) {
      if (this.isNotFoundError(error)) return false;
      throw error;
    }
    
    return true;
  }
}
