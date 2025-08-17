# Todo Model Feature - Frontend Implementation Plan

## Context

This plan focuses specifically on implementing the Todo model feature for the Angular frontend, based on specification `02-todo-model.md`. The backend provides REST endpoints for CRUD operations, and the frontend needs to integrate with these APIs while providing robust error handling, validation, and state management.

### Feature Description
- Implement Todo interface and TypeScript models
- Integrate with backend REST API endpoints
- Add client-side validation and error handling
- Ensure seamless integration with existing components
- Provide comprehensive testing for the Todo model layer

### Requirements Analysis
- **Backend API**: 6 REST endpoints for full CRUD operations
- **Todo Model**: id (Long), title (String, max 500 chars), completed (boolean)
- **Validation**: Client-side input validation matching backend constraints
- **Error Handling**: Graceful handling of API failures and validation errors
- **State Management**: Reactive state updates with optimistic UI changes

## Architecture

### Model Structure
```
src/app/features/todos/models/
├── todo.interface.ts           # Core Todo interface and related types
├── todo-create.dto.ts         # Data Transfer Object for creating todos
├── todo-update.dto.ts         # Data Transfer Object for updating todos
├── todo-validation.ts         # Client-side validation functions
└── index.ts                   # Barrel export for clean imports
```

### Service Integration Points
```
TodoService (existing) integrations:
├── HTTP Client → Backend REST APIs
├── State Management → BehaviorSubject<Todo[]>
├── Error Handling → ErrorService integration
├── Validation → Input validation before API calls
└── Optimistic Updates → Immediate UI updates with rollback
```

### Component Integration
```
Existing Components Integration:
├── TodoAppComponent → Service method calls with error handling
├── TodoListComponent → Display filtered todos from service state
├── TodoItemComponent → CRUD operations via event emissions
└── TodoFilterComponent → Filter logic based on todo.completed property
```

## Implementation

### 1. Enhanced Todo Model Definitions

#### `/Users/jurgenpetri/git/github/ai-dev-demo/todo-frontend/src/app/features/todos/models/todo.interface.ts`

**Current Issues to Address:**
- `id` should be `number` (not optional) to match backend Long type
- Need additional interfaces for DTOs and validation
- Missing error handling types

**Updated Implementation:**
```typescript
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
```

#### `/Users/jurgenpetri/git/github/ai-dev-demo/todo-frontend/src/app/features/todos/models/todo-validation.ts`

**New File - Client-side Validation:**
```typescript
import { TodoValidationError } from './todo.interface';

export class TodoValidator {
  static readonly MAX_TITLE_LENGTH = 500;
  static readonly MIN_TITLE_LENGTH = 1;

  static validateTitle(title: string): TodoValidationError[] {
    const errors: TodoValidationError[] = [];
    const trimmedTitle = title.trim();

    if (!trimmedTitle || trimmedTitle.length < this.MIN_TITLE_LENGTH) {
      errors.push({
        field: 'title',
        message: 'Todo title cannot be empty'
      });
    }

    if (trimmedTitle.length > this.MAX_TITLE_LENGTH) {
      errors.push({
        field: 'title',
        message: `Todo title cannot exceed ${this.MAX_TITLE_LENGTH} characters`
      });
    }

    return errors;
  }

  static validateTodo(todo: Partial<Todo>): TodoValidationError[] {
    const errors: TodoValidationError[] = [];

    if (todo.title !== undefined) {
      errors.push(...this.validateTitle(todo.title));
    }

    return errors;
  }

  static isValidTitle(title: string): boolean {
    return this.validateTitle(title).length === 0;
  }
}
```

#### `/Users/jurgenpetri/git/github/ai-dev-demo/todo-frontend/src/app/features/todos/models/index.ts`

**New File - Barrel Exports:**
```typescript
export * from './todo.interface';
export * from './todo-validation';
```

### 2. Enhanced TodoService Implementation

#### Update `/Users/jurgenpetri/git/github/ai-dev-demo/todo-frontend/src/app/core/services/todo.service.ts`

**Key Issues to Address:**
- Backend uses PUT /api/todos/{id}/toggle but service expects toggle-all endpoint
- Need proper error handling and validation integration
- Missing proper error recovery and retry logic
- Need to handle HTTP status codes properly

**Updated Implementation:**
```typescript
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
    // Client-side validation
    const validationErrors = TodoValidator.validateTitle(title);
    if (validationErrors.length > 0) {
      return throwError(() => new Error(validationErrors[0].message));
    }

    const request: CreateTodoRequest = { 
      title: title.trim() 
    };

    // Optimistic update
    const optimisticTodo: Todo = {
      id: Date.now(), // Temporary ID for optimistic update
      title: request.title,
      completed: false
    };

    const currentTodos = this.todosSubject.value;
    this.updateTodos([...currentTodos, optimisticTodo]);

    return this.http.post<Todo>(this.apiUrl, request).pipe(
      tap(createdTodo => {
        // Replace optimistic todo with real todo from server
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

  // PUT /api/todos/{id} - Update todo
  updateTodo(id: TodoId, updates: UpdateTodoRequest): Observable<Todo> {
    // Client-side validation if title is being updated
    if (updates.title !== undefined) {
      const validationErrors = TodoValidator.validateTitle(updates.title);
      if (validationErrors.length > 0) {
        return throwError(() => new Error(validationErrors[0].message));
      }
      updates.title = updates.title.trim();
    }

    // Optimistic update
    const currentTodos = this.todosSubject.value;
    const optimisticTodos = currentTodos.map(todo => 
      todo.id === id ? { ...todo, ...updates } : todo
    );
    this.updateTodos(optimisticTodos);

    return this.http.put<Todo>(`${this.apiUrl}/${id}`, updates).pipe(
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

  // Toggle all todos (not available in backend spec - removed)
  // This functionality would need to be implemented as individual toggle calls
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

    // Execute individual toggle requests
    const toggleRequests = todosToToggle.map(todo => 
      this.http.put<Todo>(`${this.apiUrl}/${todo.id}/toggle`, {})
    );

    // Execute all toggles in parallel - this would need backend support for bulk operations
    // For now, return error as this endpoint doesn't exist
    return throwError(() => new Error('Bulk toggle operation not supported by backend'));
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
```

### 3. Component Integration Updates

#### Update `/Users/jurgenpetri/git/github/ai-dev-demo/todo-frontend/src/app/features/todos/components/todo-app/todo-app.component.ts`

**Key Changes:**
- Remove toggleAllTodos call since it's not supported by backend
- Add proper error handling with user feedback
- Improve validation feedback

```typescript
// In onToggleAll method, replace with individual toggles:
onToggleAll(): void {
  this.stats$
    .pipe(takeUntil(this.destroy$))
    .subscribe(stats => {
      const shouldComplete = stats.active > 0;
      const currentTodos = this.todosSubject.value;
      const todosToToggle = currentTodos.filter(todo => todo.completed !== shouldComplete);
      
      // Execute individual toggle operations
      todosToToggle.forEach(todo => {
        this.todoService.toggleTodo(todo.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => this.cdr.markForCheck(),
            error: (error) => console.error('Failed to toggle todo:', error)
          });
      });
    });
}

// Add validation for create todo
onCreateTodo(title: string): void {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    this.errorService.handleError('Todo title cannot be empty');
    return;
  }

  if (trimmedTitle.length > 500) {
    this.errorService.handleError('Todo title cannot exceed 500 characters');
    return;
  }

  this.todoService.createTodo(trimmedTitle)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to create todo:', error);
        // ErrorService will handle user notification via interceptor
      }
    });
}
```

### 4. Testing Strategy

#### Update `/Users/jurgenpetri/git/github/ai-dev-demo/todo-frontend/src/app/core/services/todo.service.spec.ts`

**Enhanced Test Coverage:**
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TodoService } from './todo.service';
import { Todo, CreateTodoRequest, UpdateTodoRequest } from '../../features/todos/models';

describe('TodoService', () => {
  let service: TodoService;
  let httpMock: HttpTestingController;

  const mockTodos: Todo[] = [
    { id: 1, title: 'Test Todo 1', completed: false },
    { id: 2, title: 'Test Todo 2', completed: true }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TodoService]
    });
    
    service = TestBed.inject(TodoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTodos', () => {
    it('should retrieve todos from API', () => {
      service.getTodos().subscribe(todos => {
        expect(todos).toEqual(mockTodos);
      });

      const req = httpMock.expectOne('/api/todos');
      expect(req.request.method).toBe('GET');
      req.flush(mockTodos);
    });

    it('should retry failed requests', () => {
      let callCount = 0;
      service.getTodos().subscribe({
        next: todos => expect(todos).toEqual(mockTodos),
        error: () => fail('Should not error after retries')
      });

      // Simulate 2 failures, then success
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne('/api/todos');
        if (i < 2) {
          req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
        } else {
          req.flush(mockTodos);
        }
      }
    });
  });

  describe('createTodo', () => {
    it('should create todo via POST request', () => {
      const newTodoTitle = 'New Test Todo';
      const createdTodo: Todo = { id: 3, title: newTodoTitle, completed: false };

      service.createTodo(newTodoTitle).subscribe(todo => {
        expect(todo).toEqual(createdTodo);
      });

      const req = httpMock.expectOne('/api/todos');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ title: newTodoTitle });
      req.flush(createdTodo);
    });

    it('should validate title before API call', () => {
      service.createTodo('').subscribe({
        next: () => fail('Should not succeed with empty title'),
        error: error => expect(error.message).toContain('cannot be empty')
      });

      httpMock.expectNone('/api/todos');
    });

    it('should validate title length', () => {
      const longTitle = 'a'.repeat(501);
      
      service.createTodo(longTitle).subscribe({
        next: () => fail('Should not succeed with long title'),
        error: error => expect(error.message).toContain('cannot exceed 500 characters')
      });

      httpMock.expectNone('/api/todos');
    });

    it('should trim title before sending', () => {
      const titleWithSpaces = '  Test Todo  ';
      const trimmedTitle = 'Test Todo';
      const createdTodo: Todo = { id: 3, title: trimmedTitle, completed: false };

      service.createTodo(titleWithSpaces).subscribe();

      const req = httpMock.expectOne('/api/todos');
      expect(req.request.body).toEqual({ title: trimmedTitle });
      req.flush(createdTodo);
    });
  });

  describe('updateTodo', () => {
    it('should update todo via PUT request', () => {
      const todoId = 1;
      const updates: UpdateTodoRequest = { title: 'Updated Title' };
      const updatedTodo: Todo = { id: todoId, title: 'Updated Title', completed: false };

      service.updateTodo(todoId, updates).subscribe(todo => {
        expect(todo).toEqual(updatedTodo);
      });

      const req = httpMock.expectOne(`/api/todos/${todoId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ title: 'Updated Title' });
      req.flush(updatedTodo);
    });

    it('should handle 404 error for non-existent todo', () => {
      const todoId = 999;
      const updates: UpdateTodoRequest = { title: 'Updated Title' };

      service.updateTodo(todoId, updates).subscribe({
        next: () => fail('Should not succeed for non-existent todo'),
        error: error => expect(error.status).toBe(404)
      });

      const req = httpMock.expectOne(`/api/todos/${todoId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('toggleTodo', () => {
    it('should toggle todo via PUT request', () => {
      const todoId = 1;
      const toggledTodo: Todo = { id: todoId, title: 'Test Todo 1', completed: true };

      service.toggleTodo(todoId).subscribe(todo => {
        expect(todo).toEqual(toggledTodo);
      });

      const req = httpMock.expectOne(`/api/todos/${todoId}/toggle`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush(toggledTodo);
    });
  });

  describe('deleteTodo', () => {
    it('should delete todo via DELETE request', () => {
      const todoId = 1;

      service.deleteTodo(todoId).subscribe();

      const req = httpMock.expectOne(`/api/todos/${todoId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('clearCompleted', () => {
    it('should clear completed todos via DELETE request', () => {
      service.clearCompleted().subscribe();

      const req = httpMock.expectOne('/api/todos/completed');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('optimistic updates', () => {
    it('should perform optimistic update and rollback on error', () => {
      // Set initial state
      service.getTodos().subscribe();
      const req = httpMock.expectOne('/api/todos');
      req.flush(mockTodos);

      let todosState: Todo[] = [];
      service.todos$.subscribe(todos => todosState = todos);

      // Attempt to create todo that will fail
      service.createTodo('Test').subscribe({
        error: () => {} // Ignore error for this test
      });

      // Should see optimistic update first
      expect(todosState.length).toBe(3); // Original 2 + optimistic 1

      // Then API call fails
      const createReq = httpMock.expectOne('/api/todos');
      createReq.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      // Should rollback to original state
      expect(todosState.length).toBe(2);
      expect(todosState).toEqual(mockTodos);
    });
  });

  describe('getStats', () => {
    it('should calculate stats correctly', () => {
      service.getTodos().subscribe();
      const req = httpMock.expectOne('/api/todos');
      req.flush(mockTodos);

      service.getStats().subscribe(stats => {
        expect(stats.total).toBe(2);
        expect(stats.active).toBe(1);
        expect(stats.completed).toBe(1);
      });
    });
  });
});
```

### 5. E2E Testing Scenarios

#### `/Users/jurgenpetri/git/github/ai-dev-demo/todo-frontend/e2e/todo-model.e2e-spec.ts`

**New File - Todo Model E2E Tests:**
```typescript
describe('Todo Model Integration', () => {
  beforeEach(() => {
    cy.visit('/');
    // Clear existing todos
    cy.request('DELETE', '/api/todos/completed');
  });

  it('should create todo with valid title', () => {
    const todoTitle = 'Test Todo Creation';
    
    cy.get('.new-todo').type(`${todoTitle}{enter}`);
    
    cy.get('.todo-list li').should('have.length', 1);
    cy.get('.todo-list li label').should('contain', todoTitle);
    
    // Verify it was saved to backend
    cy.request('GET', '/api/todos').then(response => {
      expect(response.body).to.have.length(1);
      expect(response.body[0].title).to.equal(todoTitle);
      expect(response.body[0].completed).to.be.false;
    });
  });

  it('should not create todo with empty title', () => {
    cy.get('.new-todo').type('   {enter}');
    cy.get('.todo-list li').should('have.length', 0);
    
    // Should show error message
    cy.get('.error-message').should('contain', 'cannot be empty');
  });

  it('should not create todo with title exceeding 500 characters', () => {
    const longTitle = 'a'.repeat(501);
    
    cy.get('.new-todo').type(`${longTitle}{enter}`);
    cy.get('.todo-list li').should('have.length', 0);
    
    // Should show error message
    cy.get('.error-message').should('contain', 'cannot exceed 500 characters');
  });

  it('should toggle todo completion status', () => {
    // Create a todo first
    cy.request('POST', '/api/todos', { title: 'Toggle Test Todo' });
    cy.reload();
    
    cy.get('.todo-list li .toggle').click();
    cy.get('.todo-list li').should('have.class', 'completed');
    
    // Verify backend state
    cy.request('GET', '/api/todos').then(response => {
      expect(response.body[0].completed).to.be.true;
    });
    
    // Toggle back
    cy.get('.todo-list li .toggle').click();
    cy.get('.todo-list li').should('not.have.class', 'completed');
    
    cy.request('GET', '/api/todos').then(response => {
      expect(response.body[0].completed).to.be.false;
    });
  });

  it('should update todo title', () => {
    const originalTitle = 'Original Title';
    const updatedTitle = 'Updated Title';
    
    // Create todo
    cy.request('POST', '/api/todos', { title: originalTitle });
    cy.reload();
    
    // Start editing
    cy.get('.todo-list li label').dblclick();
    cy.get('.todo-list li .edit')
      .clear()
      .type(`${updatedTitle}{enter}`);
    
    cy.get('.todo-list li label').should('contain', updatedTitle);
    
    // Verify backend
    cy.request('GET', '/api/todos').then(response => {
      expect(response.body[0].title).to.equal(updatedTitle);
    });
  });

  it('should delete todo', () => {
    // Create todo
    cy.request('POST', '/api/todos', { title: 'Delete Test Todo' });
    cy.reload();
    
    cy.get('.todo-list li').should('have.length', 1);
    
    // Hover and click destroy button
    cy.get('.todo-list li').trigger('mouseover');
    cy.get('.todo-list li .destroy').click();
    
    cy.get('.todo-list li').should('have.length', 0);
    
    // Verify backend
    cy.request('GET', '/api/todos').then(response => {
      expect(response.body).to.have.length(0);
    });
  });

  it('should handle server errors gracefully', () => {
    // Intercept API call to simulate server error
    cy.intercept('POST', '/api/todos', { statusCode: 500 }).as('createTodoError');
    
    cy.get('.new-todo').type('Test Error Handling{enter}');
    
    cy.wait('@createTodoError');
    
    // Should show error message
    cy.get('.error-message').should('contain', 'Server error');
    
    // Todo should not appear in list
    cy.get('.todo-list li').should('have.length', 0);
  });

  it('should perform optimistic updates', () => {
    // Create a todo first
    cy.request('POST', '/api/todos', { title: 'Optimistic Test' });
    cy.reload();
    
    // Intercept toggle request with delay to see optimistic update
    cy.intercept('PUT', '/api/todos/*/toggle', (req) => {
      req.reply((res) => {
        // Delay response to see optimistic update
        setTimeout(() => res.send({ statusCode: 200 }), 500);
      });
    }).as('toggleTodo');
    
    // Click toggle
    cy.get('.todo-list li .toggle').click();
    
    // Should immediately show as completed (optimistic update)
    cy.get('.todo-list li').should('have.class', 'completed');
    
    // Wait for actual API response
    cy.wait('@toggleTodo');
    
    // Should still be completed
    cy.get('.todo-list li').should('have.class', 'completed');
  });
});
```

## Commands

### Angular CLI Commands for Implementation

```bash
# 1. Create new model files
touch src/app/features/todos/models/todo-validation.ts
touch src/app/features/todos/models/index.ts

# 2. Update existing service (manual editing required)
# File: src/app/core/services/todo.service.ts

# 3. Run tests to verify implementation
ng test --watch=false
ng test --code-coverage

# 4. Add E2E tests
ng generate e2e todo-model

# 5. Run E2E tests
ng e2e

# 6. Lint and format code
ng lint
npx prettier --write "src/**/*.{ts,html,css}"
```

### NPM Package Dependencies

**No additional packages required** - implementation uses existing Angular and RxJS features.

### Testing Commands

```bash
# Unit tests
ng test --watch=false --code-coverage

# E2E tests
ng e2e

# Specific test suites
ng test --include="**/todo.service.spec.ts"
ng test --include="**/todo-validation.spec.ts"

# Test with backend integration
ng serve --proxy-config proxy.conf.json &
npm run test:e2e:integration
```

## Testing

### Testing Strategy

#### 1. Unit Testing Focus Areas
- **TodoValidator**: Input validation logic
- **TodoService**: HTTP client integration, error handling, optimistic updates
- **Component Integration**: Service interaction, error handling
- **Error Scenarios**: Network failures, validation errors, server errors

#### 2. Integration Testing
- **API Integration**: Real backend API calls
- **Error Recovery**: Optimistic update rollbacks
- **State Synchronization**: Component state vs service state
- **Validation Flow**: Client-side validation + server-side validation

#### 3. E2E Testing Scenarios
- **Happy Path**: Create, read, update, delete todos
- **Validation**: Empty titles, long titles, special characters
- **Error Handling**: Server errors, network failures
- **Optimistic Updates**: Immediate UI feedback
- **State Persistence**: Page refresh, browser back/forward

### Test Coverage Goals
- **TodoValidator**: 100% line coverage
- **TodoService**: 95% line coverage
- **Component Integration**: 90% line coverage
- **E2E Critical Flows**: 100% coverage

## Risks

### Technical Risks

#### 1. API Compatibility Issues
- **Risk**: Backend API changes breaking frontend integration
- **Mitigation**: Comprehensive integration tests, API contract testing
- **Detection**: Automated E2E tests in CI/CD pipeline

#### 2. State Synchronization Problems
- **Risk**: Optimistic updates causing UI/backend state mismatch
- **Mitigation**: Proper error handling with rollback mechanisms
- **Detection**: Integration tests with simulated network failures

#### 3. Validation Inconsistency
- **Risk**: Client-side validation not matching backend validation
- **Mitigation**: Shared validation rules, comprehensive test coverage
- **Detection**: E2E tests covering validation edge cases

#### 4. Performance with Large Datasets
- **Risk**: Poor performance with many todos
- **Mitigation**: Efficient filtering, OnPush change detection
- **Detection**: Performance testing with large datasets

### Implementation Risks

#### 1. Error Handling Gaps
- **Risk**: Unhandled error scenarios causing poor UX
- **Mitigation**: Comprehensive error interceptor, user-friendly error messages
- **Detection**: Error scenario testing

#### 2. Memory Leaks
- **Risk**: Subscription leaks in components
- **Mitigation**: Proper subscription management with takeUntil pattern
- **Detection**: Memory profiling during testing

#### 3. Race Conditions
- **Risk**: Multiple concurrent API calls causing state corruption
- **Mitigation**: Proper state management, request cancellation
- **Detection**: Concurrency testing

### Mitigation Strategies

1. **Comprehensive Testing**: Unit, integration, and E2E tests
2. **Error Boundaries**: Global error handling with user feedback
3. **State Management**: Immutable state updates, proper subscription handling
4. **Performance Monitoring**: Bundle size analysis, runtime performance tracking
5. **Code Quality**: Linting, type checking, code reviews

## Integration Points

### Existing Component Updates Required

1. **TodoAppComponent**:
   - Remove `toggleAllTodos` call (not supported by backend)
   - Add validation error handling for user feedback
   - Implement individual toggle operations for "toggle all" functionality

2. **TodoService**:
   - Update all methods to match exact backend API specification
   - Add comprehensive error handling and validation
   - Implement optimistic updates with rollback

3. **Error Handling**:
   - Update ErrorService to handle TodoApiError types
   - Add user-friendly validation error messages
   - Implement retry mechanisms for failed requests

### No Changes Required

1. **TodoListComponent**: Filtering logic remains the same
2. **TodoItemComponent**: Event emissions work with updated service
3. **TodoFilterComponent**: No changes needed
4. **HTTP Interceptors**: Work with enhanced error handling

This implementation plan provides a robust foundation for the Todo model feature while maintaining compatibility with existing components and following Angular best practices.
