import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { map, catchError, retry, delayWhen, tap } from 'rxjs/operators';
import { 
  Todo, 
  TodoStats, 
  CreateTodoRequest, 
  UpdateTodoRequest,
  TodoApiError,
  TodoId 
} from '../../features/todos/models';
import { TodoValidator } from '../../features/todos/models/todo-validation';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly apiUrl = '/api/todos';
  private todosSubject = new BehaviorSubject<Todo[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  public todos$ = this.todosSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // GET /api/todos - Retrieve all todos
  getTodos(): Observable<Todo[]> {
    this.setLoading(true);
    
    return this.http.get<Todo[]>(this.apiUrl).pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => timer(retryCount * 1000)
      }),
      tap(todos => {
        this.updateTodos(todos);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError(error);
      })
    );
  }

  // POST /api/todos - Create new todo
  createTodo(title: string): Observable<Todo> {
    // Exact specification validation
    const trimmedTitle = title.trim();
    
    if (!trimmedTitle) {
      return throwError(() => new Error('Todo title cannot be empty'));
    }
    
    if (trimmedTitle.length > TodoValidator.MAX_TITLE_LENGTH) {
      return throwError(() => new Error(`Todo title cannot exceed ${TodoValidator.MAX_TITLE_LENGTH} characters`));
    }

    const request: CreateTodoRequest = { 
      title: trimmedTitle 
    };

    // Optimistic update with negative ID for temporary todos
    const tempTodo: Todo = {
      id: -(Date.now()), // Negative ID for temp todos
      title: trimmedTitle,
      completed: false
    };

    const currentTodos = this.todosSubject.value;
    this.updateTodos([...currentTodos, tempTodo]);

    return this.http.post<Todo>(this.apiUrl, request).pipe(
      tap(createdTodo => {
        // Replace temp todo with real todo from server
        const updatedTodos = currentTodos.concat(createdTodo);
        this.updateTodos(updatedTodos);
      }),
      catchError(error => {
        // Rollback optimistic update
        this.updateTodos(currentTodos);
        return this.handleError(error);
      })
    );
  }

  // PUT /api/todos/{id} - Update todo (standardized to match specification)
  updateTodo(id: TodoId, title: string): Observable<Todo> {
    // Exact specification validation
    const trimmedTitle = title.trim();
    
    if (!trimmedTitle) {
      return throwError(() => new Error('Todo title cannot be empty'));
    }
    
    if (trimmedTitle.length > TodoValidator.MAX_TITLE_LENGTH) {
      return throwError(() => new Error(`Todo title cannot exceed ${TodoValidator.MAX_TITLE_LENGTH} characters`));
    }

    const request: UpdateTodoRequest = { title: trimmedTitle };

    // Optimistic update
    const currentTodos = this.todosSubject.value;
    const optimisticTodos = currentTodos.map(todo => 
      todo.id === id ? { ...todo, title: trimmedTitle } : todo
    );
    this.updateTodos(optimisticTodos);

    return this.http.put<Todo>(`${this.apiUrl}/${id}`, request).pipe(
      tap(updatedTodo => {
        // Update with server response
        const serverUpdatedTodos = currentTodos.map(todo => 
          todo.id === id ? updatedTodo : todo
        );
        this.updateTodos(serverUpdatedTodos);
      }),
      catchError(error => {
        // Rollback optimistic update
        this.updateTodos(currentTodos);
        return this.handleError(error);
      })
    );
  }

  // DELETE /api/todos/{id} - Delete todo
  deleteTodo(id: TodoId): Observable<void> {
    // Optimistic update
    const currentTodos = this.todosSubject.value;
    const optimisticTodos = currentTodos.filter(todo => todo.id !== id);
    this.updateTodos(optimisticTodos);

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        // Rollback optimistic update
        this.updateTodos(currentTodos);
        return this.handleError(error);
      })
    );
  }

  // PUT /api/todos/{id}/toggle - Toggle todo completion status
  toggleTodo(id: TodoId): Observable<Todo> {
    // Optimistic update
    const currentTodos = this.todosSubject.value;
    const optimisticTodos = currentTodos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    this.updateTodos(optimisticTodos);

    return this.http.put<Todo>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      tap(updatedTodo => {
        // Update with server response
        const serverUpdatedTodos = currentTodos.map(todo => 
          todo.id === id ? updatedTodo : todo
        );
        this.updateTodos(serverUpdatedTodos);
      }),
      catchError(error => {
        // Rollback optimistic update
        this.updateTodos(currentTodos);
        return this.handleError(error);
      })
    );
  }

  // DELETE /api/todos/completed - Delete all completed todos
  clearCompleted(): Observable<void> {
    // Optimistic update
    const currentTodos = this.todosSubject.value;
    const optimisticTodos = currentTodos.filter(todo => !todo.completed);
    this.updateTodos(optimisticTodos);

    return this.http.delete<void>(`${this.apiUrl}/completed`).pipe(
      catchError(error => {
        // Rollback optimistic update
        this.updateTodos(currentTodos);
        return this.handleError(error);
      })
    );
  }

  // Toggle all todos - implemented as individual toggle calls since backend doesn't support bulk operations
  toggleAllTodos(completed: boolean): Observable<Todo[]> {
    const currentTodos = this.todosSubject.value;
    const todosToToggle = currentTodos.filter(todo => todo.completed !== completed);
    
    if (todosToToggle.length === 0) {
      return new Observable(subscriber => {
        subscriber.next(currentTodos);
        subscriber.complete();
      });
    }

    // Optimistic update
    const optimisticTodos = currentTodos.map(todo => ({ ...todo, completed }));
    this.updateTodos(optimisticTodos);

    // Execute individual toggle requests - for now we'll handle this in components
    // since backend doesn't support bulk toggle
    return throwError(() => new Error('Bulk toggle operation should be handled at component level'));
  }

  // Get todo statistics (derived from current state)
  getStats(): Observable<TodoStats> {
    return this.todos$.pipe(
      map(todos => {
        const total = todos.length;
        const completed = todos.filter(todo => todo.completed).length;
        const active = total - completed;
        return { total, active, completed };
      })
    );
  }

  // Get todo by ID
  getTodoById(id: TodoId): Observable<Todo | undefined> {
    return this.todos$.pipe(
      map(todos => todos.find(todo => todo.id === id))
    );
  }

  // Private helper methods
  private updateTodos(todos: Todo[]): void {
    this.todosSubject.next(todos);
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: TodoApiError;

    if (error.status === 0) {
      // Network error
      apiError = {
        status: 0,
        message: 'Network error. Please check your connection.'
      };
    } else if (error.status === 400 && error.error?.message) {
      // Validation error from backend
      apiError = {
        status: 400,
        message: error.error.message,
        errors: error.error.errors || []
      };
    } else if (error.status === 404) {
      apiError = {
        status: 404,
        message: 'Todo not found.'
      };
    } else if (error.status >= 500) {
      apiError = {
        status: error.status,
        message: 'Server error. Please try again later.'
      };
    } else {
      apiError = {
        status: error.status,
        message: error.error?.message || 'An unexpected error occurred.'
      };
    }

    console.error('TodoService error:', error);
    return throwError(() => apiError);
  }
}