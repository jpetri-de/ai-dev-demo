// Core Todo interface matching backend model
export interface Todo {
  id: number;          // Required, matches backend Long
  title: string;       // Required, max 500 characters
  completed: boolean;  // Required, default false
}

// Data Transfer Objects for API calls
export interface CreateTodoRequest {
  title: string;
}

export interface UpdateTodoRequest {
  title?: string;
  completed?: boolean;
}

// Validation and Error Types
export interface TodoValidationError {
  field: string;
  message: string;
}

export interface TodoApiError {
  status: number;
  message: string;
  errors?: TodoValidationError[];
}

// Filter and Stats interfaces (keep existing)
export interface TodoFilter {
  type: 'all' | 'active' | 'completed';
  label: string;
}

export interface TodoStats {
  total: number;
  active: number;
  completed: number;
}

// Helper types for better type safety
export type TodoId = number;
export type TodoStatus = 'active' | 'completed';