import { SupabaseClient } from "@supabase/supabase-js";

export interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<{ data: T[]; count: number }>;
  create(data: Partial<T>): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  filters?: Record<string, unknown>;
}

export interface SupabaseRepository<T> extends Repository<T, string> {
  getClient(): SupabaseClient;
  getTableName(): string;
}
