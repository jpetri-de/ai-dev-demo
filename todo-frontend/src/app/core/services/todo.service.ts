import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer, forkJoin, of } from 'rxjs';
import { map, catchError, retry, delayWhen, tap, switchMap } from 'rxjs/operators';
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
  private readonly apiUrl = 'http://localhost:8080/api/todos';
  private todosSubject = new BehaviorSubject<Todo[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  public todos$ = this.todosSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Enhanced observable streams for reactive UI components
  public activeCount$ = this.todos$.pipe(
    map(todos => todos.filter(todo => !todo.completed).length)
  );

  public completedCount$ = this.todos$.pipe(
    map(todos => todos.filter(todo => todo.completed).length)
  );

  public hasTodos$ = this.todos$.pipe(
    map(todos => todos.length > 0)
  );

  public hasCompleted$ = this.todos$.pipe(
    map(todos => todos.some(todo => todo.completed))
  );

  public allCompleted$ = this.todos$.pipe(
    map(todos => todos.length > 0 && todos.every(todo => todo.completed))
  );

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

  // POST /api/todos - Create new todo with enhanced error handling
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
      retry({
        count: 2,
        delay: (error, retryCount) => timer(retryCount * 500)
      }),
      tap(createdTodo => {
        // Replace temp todo with real todo from server using current state
        const latestTodos = this.todosSubject.value;
        const updatedTodos = latestTodos.map(todo => 
          todo.id === tempTodo.id ? createdTodo : todo
        );
        this.updateTodos(updatedTodos);
      }),
      catchError(error => {
        // Rollback optimistic update
        this.updateTodos(currentTodos);
        return this.handleError(error);
      })
    );
  }

  // PUT /api/todos/{id} - Update todo with enhanced validation
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
      retry({
        count: 2,
        delay: (error, retryCount) => timer(retryCount * 500)
      }),
      tap(updatedTodo => {
        // Update with server response using current state (not old state)
        const latestTodos = this.todosSubject.value;
        const serverUpdatedTodos = latestTodos.map(todo => 
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
      retry({
        count: 2,
        delay: (error, retryCount) => timer(retryCount * 500)
      }),
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
        // Update with server response using current state (not old state)
        const latestTodos = this.todosSubject.value;
        const serverUpdatedTodos = latestTodos.map(todo => 
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
      retry({
        count: 2,
        delay: (error, retryCount) => timer(retryCount * 500)
      }),
      catchError(error => {
        // Rollback optimistic update
        this.updateTodos(currentTodos);
        return this.handleError(error);
      })
    );
  }

  // Enhanced toggle all todos with optimistic updates and retry mechanism
  toggleAllTodos(completed: boolean): Observable<Todo[]> {
    const currentTodos = this.todosSubject.value;
    const todosToToggle = currentTodos.filter(todo => todo.completed !== completed);
    
    if (todosToToggle.length === 0) {
      return of(currentTodos);
    }

    // Optimistic update - immediately update UI
    const optimisticTodos = currentTodos.map(todo => ({ ...todo, completed }));
    this.updateTodos(optimisticTodos);

    // Execute individual toggle requests in parallel
    const toggleOperations = todosToToggle.map(todo => 
      this.http.put<Todo>(`${this.apiUrl}/${todo.id}/toggle`, {}).pipe(
        retry({
          count: 2,
          delay: (error, retryCount) => timer(retryCount * 500)
        }),
        catchError(error => {
          console.warn(`Failed to toggle todo ${todo.id}:`, error);
          // Return the original todo on error
          return of(todo);
        })
      )
    );

    return forkJoin(toggleOperations).pipe(
      map(toggledTodos => {
        // Create a map of toggled todos for quick lookup
        const toggledMap = new Map(toggledTodos.map(t => [t.id, t]));
        
        // Update with server responses, keeping the completed state from server
        const finalTodos = currentTodos.map(todo => {
          if (toggledMap.has(todo.id)) {
            // Use the server response for toggled todos
            return toggledMap.get(todo.id)!;
          } else {
            // Keep todos that weren't toggled as-is (they already had the right state)
            return { ...todo, completed };
          }
        });
        
        this.updateTodos(finalTodos);
        return finalTodos;
      }),
      catchError(error => {
        // Rollback optimistic update on complete failure
        this.updateTodos(currentTodos);
        return this.handleError(error);
      })
    );
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

  // Get individual count observables for reactive components
  getActiveCount(): Observable<number> {
    return this.activeCount$;
  }

  getCompletedCount(): Observable<number> {
    return this.completedCount$;
  }

  // Get todo by ID
  getTodoById(id: TodoId): Observable<Todo | undefined> {
    return this.todos$.pipe(
      map(todos => todos.find(todo => todo.id === id))
    );
  }

  // Filter todos by type
  getFilteredTodos(filter: 'all' | 'active' | 'completed'): Observable<Todo[]> {
    return this.todos$.pipe(
      map(todos => {
        switch (filter) {
          case 'active':
            return todos.filter(todo => !todo.completed);
          case 'completed':
            return todos.filter(todo => todo.completed);
          default:
            return todos;
        }
      })
    );
  }

  // Network status detection for enhanced error handling
  isOnline(): boolean {
    return navigator.onLine;
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
        message: this.isOnline() 
          ? 'Network error. Please check your connection.'
          : 'You are offline. Please check your internet connection.'
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