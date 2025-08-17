export interface Todo {
  id?: number;
  title: string;
  completed: boolean;
}

export interface TodoFilter {
  type: 'all' | 'active' | 'completed';
  label: string;
}

export interface TodoStats {
  total: number;
  active: number;
  completed: number;
}