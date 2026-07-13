export interface Service<T, ID = string> {
  getById(id: ID): Promise<T | null>;
  list(options?: ServiceQueryOptions): Promise<{ data: T[]; count: number }>;
  create(input: unknown): Promise<T>;
  update(id: ID, input: unknown): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}

export interface ServiceQueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, unknown>;
  search?: string;
}

export interface ServiceFactory<T, ID = string> {
  createService(deps: ServiceDependencies): Service<T, ID>;
}

export interface ServiceDependencies {
  db?: unknown;
  logger?: Pick<Console, "info" | "warn" | "error" | "debug">;
  cache?: {
    get(key: string): Promise<unknown | null>;
    set(key: string, value: unknown, ttlMs: number): Promise<void>;
    invalidate(key: string): Promise<void>;
  };
}
