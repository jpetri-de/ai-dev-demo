# Angular Frontend Implementation Plan - TodoMVC Application

## Context

This plan outlines the complete Angular 17 frontend implementation for the TodoMVC application based on the specifications in CLAUDE.md and the detailed feature specifications in the specs/ directory. The frontend will be a modern, reactive Angular application that integrates seamlessly with the Spring Boot backend.

### Feature Description
Implement a fully functional TodoMVC application with the following core requirements:
- Create, read, update, delete todos
- Mark individual todos as complete/incomplete  
- Mark all todos as complete/incomplete
- Clear completed todos
- Filter todos (all/active/completed)
- Persistent counter of active todos
- Editing todos with double-click
- Professional UI/UX with responsive design

### Requirements Analysis
Based on the specifications, the frontend must implement:
- **Todo Interface**: `{ id: number, title: string, completed: boolean }`
- **UI/UX Rules**: Hide main/footer when no todos, auto-focus input, trim validation
- **Filter States**: All/Active/Completed with visual highlighting
- **Performance**: Smooth UI with 1000+ todos
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Security**: XSS prevention, input sanitization

## Architecture

### Module Structure
```
todo-frontend/
├── src/app/
│   ├── core/                          # Singleton services, interceptors
│   │   ├── services/
│   │   │   ├── todo.service.ts         # Main HTTP API service
│   │   │   ├── ui-state.service.ts     # UI state management
│   │   │   ├── notification.service.ts  # User notifications
│   │   │   └── http-client.service.ts  # Enhanced HTTP client
│   │   ├── interceptors/
│   │   │   ├── error.interceptor.ts    # Global error handling
│   │   │   └── loading.interceptor.ts  # Global loading states
│   │   ├── guards/
│   │   │   └── todo.guard.ts           # Route protection
│   │   └── core.module.ts
│   ├── features/todos/                 # Todo feature module
│   │   ├── components/
│   │   │   ├── todo-app/               # Main container
│   │   │   ├── todo-list/              # Todo list display
│   │   │   ├── todo-item/              # Individual todo item
│   │   │   ├── todo-filter/            # Filter controls
│   │   │   ├── todo-counter/           # Active todo counter
│   │   │   └── clear-completed/        # Clear completed button
│   │   ├── models/
│   │   │   ├── todo.interface.ts       # Todo model
│   │   │   ├── todo-filter.enum.ts     # Filter types
│   │   │   └── todo-stats.interface.ts # Statistics model
│   │   ├── services/
│   │   │   └── todo-validation.service.ts # Input validation
│   │   └── todos.module.ts
│   ├── shared/                         # Reusable components/directives
│   │   ├── pipes/
│   │   │   ├── filter-todos.pipe.ts    # Todo filtering
│   │   │   └── pluralize.pipe.ts       # Text pluralization
│   │   ├── directives/
│   │   │   ├── auto-focus.directive.ts # Auto-focus functionality
│   │   │   └── escape-key.directive.ts # Escape key handling
│   │   └── shared.module.ts
│   ├── app.component.ts                # Root component
│   ├── app.module.ts                   # Root module
│   └── app-routing.module.ts           # Route configuration
├── src/assets/
│   └── main.css                        # TodoMVC base styles
├── src/styles.css                      # Global styles
├── proxy.conf.json                     # Development proxy config
└── angular.json                        # Angular CLI configuration
```

### Component Hierarchy
```
AppComponent (root)
└── TodoAppComponent (main container)
    ├── Header Section
    │   └── input.new-todo (create new todos)
    ├── Main Section (*ngIf="hasTodos$ | async")
    │   ├── input.toggle-all (toggle all todos)
    │   └── TodoListComponent
    │       └── TodoItemComponent [*ngFor] (individual todos)
    └── Footer Section (*ngIf="hasTodos$ | async")
        ├── TodoCounterComponent (active count)
        ├── TodoFilterComponent (all/active/completed)
        └── ClearCompletedComponent (clear completed)
```

### Data Flow Architecture
```
HTTP API (Spring Boot)
    ↕ (REST calls)
TodoService (BehaviorSubject state)
    ↕ (Observable streams)
UI State Service (derived state)
    ↕ (reactive updates)
Components (OnPush change detection)
    ↕ (user interactions)
View Layer (reactive templates)
```

### State Management Strategy
- **TodoService**: Central state with BehaviorSubject<Todo[]>
- **Reactive Programming**: RxJS Observables for all data flow
- **OnPush Change Detection**: Performance optimization
- **Immutable Updates**: Prevent reference bugs
- **Optimistic Updates**: Immediate UI feedback with rollback on error

## Implementation

### File-by-File Implementation Details

#### 1. Core Models and Interfaces

**`src/app/features/todos/models/todo.interface.ts`**
```typescript
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export interface CreateTodoRequest {
  title: string;
}

export interface UpdateTodoRequest {
  title: string;
}

export interface TodoStats {
  total: number;
  active: number;
  completed: number;
}
```

**`src/app/features/todos/models/todo-filter.enum.ts`**
```typescript
export enum TodoFilter {
  ALL = 'all',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

export interface FilterOption {
  key: TodoFilter;
  label: string;
  route: string;
}
```

#### 2. Core Services

**`src/app/core/services/http-client.service.ts`**
```typescript
@Injectable({
  providedIn: 'root'
})
export class HttpClientService {
  private readonly API_BASE_URL = '/api';
  
  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}
  
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.API_BASE_URL}${endpoint}`).pipe(
      retry(3),
      catchError(this.handleError.bind(this))
    );
  }
  
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.API_BASE_URL}${endpoint}`, body).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.API_BASE_URL}${endpoint}`, body).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.API_BASE_URL}${endpoint}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          break;
        case 404:
          errorMessage = 'Item not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 0:
          errorMessage = 'Unable to connect to server.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    this.notificationService.showError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
```

**`src/app/core/services/todo.service.ts`**
```typescript
@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private todos$ = new BehaviorSubject<Todo[]>([]);
  private filter$ = new BehaviorSubject<TodoFilter>(TodoFilter.ALL);
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  
  constructor(
    private httpClient: HttpClientService,
    private notificationService: NotificationService
  ) {
    this.initializeOnlineDetection();
    this.loadInitialTodos();
  }
  
  // Public Observables
  getTodos(): Observable<Todo[]> {
    return this.todos$.asObservable();
  }
  
  getFilteredTodos(): Observable<Todo[]> {
    return combineLatest([this.todos$, this.filter$]).pipe(
      map(([todos, filter]) => this.applyFilter(todos, filter)),
      debounceTime(50) // Performance optimization
    );
  }
  
  getTodoStats(): Observable<TodoStats> {
    return this.todos$.pipe(
      map(todos => ({
        total: todos.length,
        active: todos.filter(t => !t.completed).length,
        completed: todos.filter(t => t.completed).length
      }))
    );
  }
  
  getCurrentFilter(): Observable<TodoFilter> {
    return this.filter$.asObservable();
  }
  
  // CRUD Operations with Optimistic Updates
  createTodo(title: string): Observable<Todo> {
    const sanitizedTitle = this.sanitizeInput(title);
    if (!this.validateTodoTitle(sanitizedTitle)) {
      return throwError(() => new Error('Invalid todo title'));
    }
    
    // Optimistic update
    const tempTodo: Todo = {
      id: Date.now(), // Temporary ID
      title: sanitizedTitle,
      completed: false
    };
    
    const currentTodos = this.todos$.value;
    this.todos$.next([...currentTodos, tempTodo]);
    
    return this.httpClient.post<Todo>('/todos', { title: sanitizedTitle }).pipe(
      tap((createdTodo) => {
        // Replace temp todo with real todo
        const todos = this.todos$.value.map(todo => 
          todo.id === tempTodo.id ? createdTodo : todo
        );
        this.todos$.next(todos);
      }),
      catchError((error) => {
        // Rollback optimistic update
        const todos = this.todos$.value.filter(todo => todo.id !== tempTodo.id);
        this.todos$.next(todos);
        return throwError(() => error);
      })
    );
  }
  
  updateTodo(id: number, title: string): Observable<Todo> {
    const sanitizedTitle = this.sanitizeInput(title);
    if (!this.validateTodoTitle(sanitizedTitle)) {
      return throwError(() => new Error('Invalid todo title'));
    }
    
    // Optimistic update
    const todos = this.todos$.value;
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, title: sanitizedTitle } : todo
    );
    this.todos$.next(updatedTodos);
    
    return this.httpClient.put<Todo>(`/todos/${id}`, { title: sanitizedTitle }).pipe(
      tap((updatedTodo) => {
        const todos = this.todos$.value.map(todo =>
          todo.id === id ? updatedTodo : todo
        );
        this.todos$.next(todos);
      }),
      catchError((error) => {
        // Rollback
        this.todos$.next(todos);
        return throwError(() => error);
      })
    );
  }
  
  toggleTodo(id: number): Observable<Todo> {
    const todos = this.todos$.value;
    const originalTodo = todos.find(t => t.id === id);
    if (!originalTodo) {
      return throwError(() => new Error('Todo not found'));
    }
    
    // Optimistic update
    const optimisticTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    this.todos$.next(optimisticTodos);
    
    return this.httpClient.put<Todo>(`/todos/${id}/toggle`, {}).pipe(
      tap((updatedTodo) => {
        const todos = this.todos$.value.map(todo =>
          todo.id === id ? updatedTodo : todo
        );
        this.todos$.next(todos);
      }),
      catchError((error) => {
        // Rollback
        this.todos$.next(todos);
        return throwError(() => error);
      })
    );
  }
  
  deleteTodo(id: number): Observable<void> {
    // Optimistic update
    const todos = this.todos$.value;
    const optimisticTodos = todos.filter(todo => todo.id !== id);
    this.todos$.next(optimisticTodos);
    
    return this.httpClient.delete<void>(`/todos/${id}`).pipe(
      catchError((error) => {
        // Rollback
        this.todos$.next(todos);
        return throwError(() => error);
      })
    );
  }
  
  toggleAllTodos(): Observable<Todo[]> {
    const todos = this.todos$.value;
    const allCompleted = todos.every(todo => todo.completed);
    const newCompletedState = !allCompleted;
    
    // Optimistic update
    const optimisticTodos = todos.map(todo => ({ 
      ...todo, 
      completed: newCompletedState 
    }));
    this.todos$.next(optimisticTodos);
    
    return this.httpClient.put<Todo[]>('/todos/toggle-all', { 
      completed: newCompletedState 
    }).pipe(
      tap((updatedTodos) => {
        this.todos$.next(updatedTodos);
      }),
      catchError((error) => {
        // Rollback
        this.todos$.next(todos);
        return throwError(() => error);
      })
    );
  }
  
  clearCompleted(): Observable<void> {
    // Optimistic update
    const todos = this.todos$.value;
    const optimisticTodos = todos.filter(todo => !todo.completed);
    this.todos$.next(optimisticTodos);
    
    return this.httpClient.delete<void>('/todos/completed').pipe(
      catchError((error) => {
        // Rollback
        this.todos$.next(todos);
        return throwError(() => error);
      })
    );
  }
  
  // Filter Management
  setFilter(filter: TodoFilter): void {
    this.filter$.next(filter);
  }
  
  // Private Methods
  private loadInitialTodos(): void {
    this.httpClient.get<Todo[]>('/todos').subscribe({
      next: (todos) => {
        this.todos$.next(todos);
      },
      error: (error) => {
        console.error('Failed to load initial todos:', error);
        this.todos$.next([]);
      }
    });
  }
  
  private applyFilter(todos: Todo[], filter: TodoFilter): Todo[] {
    switch (filter) {
      case TodoFilter.ACTIVE:
        return todos.filter(todo => !todo.completed);
      case TodoFilter.COMPLETED:
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }
  
  private sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Basic XSS protection
      .substring(0, 500); // Enforce length limit
  }
  
  private validateTodoTitle(title: string): boolean {
    return title.length > 0 && title.length <= 500 && title.trim().length > 0;
  }
  
  private initializeOnlineDetection(): void {
    window.addEventListener('online', () => {
      this.isOnline$.next(true);
      this.loadInitialTodos(); // Sync when back online
    });
    
    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
      this.notificationService.showWarning('You are offline. Changes will be saved when connection is restored.');
    });
  }
}
```

**`src/app/core/services/ui-state.service.ts`**
```typescript
@Injectable({
  providedIn: 'root'
})
export class UIStateService {
  private loadingState$ = new BehaviorSubject<boolean>(false);
  private focusInputTrigger$ = new Subject<void>();
  
  constructor(private todoService: TodoService) {}
  
  isLoading(): Observable<boolean> {
    return this.loadingState$.asObservable();
  }
  
  setLoading(loading: boolean): void {
    this.loadingState$.next(loading);
  }
  
  focusInput(): void {
    this.focusInputTrigger$.next();
  }
  
  getFocusInputTrigger(): Observable<void> {
    return this.focusInputTrigger$.asObservable();
  }
  
  hasTodos(): Observable<boolean> {
    return this.todoService.getTodos().pipe(
      map(todos => todos.length > 0)
    );
  }
  
  hasActiveTodos(): Observable<boolean> {
    return this.todoService.getTodos().pipe(
      map(todos => todos.some(todo => !todo.completed))
    );
  }
  
  hasCompletedTodos(): Observable<boolean> {
    return this.todoService.getTodos().pipe(
      map(todos => todos.some(todo => todo.completed))
    );
  }
}
```

#### 3. Main Components

**`src/app/features/todos/components/todo-app/todo-app.component.ts`**
```typescript
@Component({
  selector: 'app-todo-app',
  templateUrl: './todo-app.component.html',
  styleUrls: ['./todo-app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoAppComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('newTodoInput', { static: true }) newTodoInput!: ElementRef<HTMLInputElement>;
  
  newTodoTitle = '';
  isLoading$ = this.uiStateService.isLoading();
  hasTodos$ = this.uiStateService.hasTodos();
  stats$ = this.todoService.getTodoStats();
  
  private subscription = new Subscription();
  
  constructor(
    private todoService: TodoService,
    private uiStateService: UIStateService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.subscription.add(
      this.uiStateService.getFocusInputTrigger().subscribe(() => {
        this.focusNewTodoInput();
      })
    );
  }
  
  ngAfterViewInit(): void {
    // Initial focus
    this.focusNewTodoInput();
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  createTodo(): void {
    const title = this.newTodoTitle.trim();
    if (!title) return;
    
    this.uiStateService.setLoading(true);
    
    this.todoService.createTodo(title).subscribe({
      next: () => {
        this.newTodoTitle = '';
        this.uiStateService.setLoading(false);
        this.focusNewTodoInput();
        this.cdr.markForCheck();
      },
      error: () => {
        this.uiStateService.setLoading(false);
        this.focusNewTodoInput();
        this.cdr.markForCheck();
      }
    });
  }
  
  toggleAllTodos(): void {
    this.todoService.toggleAllTodos().subscribe();
  }
  
  private focusNewTodoInput(): void {
    setTimeout(() => {
      if (this.newTodoInput?.nativeElement) {
        this.newTodoInput.nativeElement.focus();
      }
    });
  }
}
```

**`src/app/features/todos/components/todo-app/todo-app.component.html`**
```html
<section class="todoapp">
  <header class="header">
    <h1>todos</h1>
    <input 
      #newTodoInput
      class="new-todo" 
      placeholder="What needs to be done?" 
      autofocus
      [(ngModel)]="newTodoTitle"
      (keyup.enter)="createTodo()"
      [disabled]="isLoading$ | async"
      maxlength="500"
      aria-label="Create new todo"
    >
  </header>
  
  <!-- Main section only visible when todos exist -->
  <section class="main" *ngIf="hasTodos$ | async">
    <input 
      id="toggle-all" 
      class="toggle-all" 
      type="checkbox"
      [checked]="(stats$ | async)?.active === 0 && (stats$ | async)?.total > 0"
      (click)="toggleAllTodos()"
      aria-label="Toggle all todos"
    >
    <label for="toggle-all">Mark all as complete</label>
    <app-todo-list></app-todo-list>
  </section>
  
  <!-- Footer only visible when todos exist -->
  <footer class="footer" *ngIf="hasTodos$ | async">
    <app-todo-counter></app-todo-counter>
    <app-todo-filter></app-todo-filter>
    <app-clear-completed></app-clear-completed>
  </footer>
</section>
```

**`src/app/features/todos/components/todo-list/todo-list.component.ts`**
```typescript
@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoListComponent {
  filteredTodos$ = this.todoService.getFilteredTodos();
  
  constructor(private todoService: TodoService) {}
  
  trackByTodoId(index: number, todo: Todo): number {
    return todo.id;
  }
}
```

**`src/app/features/todos/components/todo-list/todo-list.component.html`**
```html
<ul class="todo-list">
  <app-todo-item 
    *ngFor="let todo of filteredTodos$ | async; trackBy: trackByTodoId"
    [todo]="todo">
  </app-todo-item>
</ul>
```

**`src/app/features/todos/components/todo-item/todo-item.component.ts`**
```typescript
@Component({
  selector: 'app-todo-item',
  templateUrl: './todo-item.component.html',
  styleUrls: ['./todo-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoItemComponent {
  @Input() todo!: Todo;
  @ViewChild('editInput', { static: false }) editInput?: ElementRef;
  
  isEditing = false;
  isLoading = false;
  editText = '';
  
  constructor(
    private todoService: TodoService,
    private uiStateService: UIStateService,
    private cdr: ChangeDetectorRef
  ) {}
  
  toggleTodo(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.todoService.toggleTodo(this.todo.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  deleteTodo(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.todoService.deleteTodo(this.todo.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  startEditing(): void {
    this.isEditing = true;
    this.editText = this.todo.title;
    this.cdr.markForCheck();
    
    setTimeout(() => {
      if (this.editInput?.nativeElement) {
        this.editInput.nativeElement.focus();
        this.editInput.nativeElement.select();
      }
    });
  }
  
  saveEdit(): void {
    const title = this.editText.trim();
    
    if (!title) {
      // Delete todo if title is empty
      this.deleteTodo();
      return;
    }
    
    if (title === this.todo.title) {
      this.cancelEdit();
      return;
    }
    
    this.isLoading = true;
    this.todoService.updateTodo(this.todo.id, title).subscribe({
      next: () => {
        this.isEditing = false;
        this.isLoading = false;
        this.uiStateService.focusInput();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  cancelEdit(): void {
    this.isEditing = false;
    this.uiStateService.focusInput();
    this.cdr.markForCheck();
  }
}
```

**`src/app/features/todos/components/todo-item/todo-item.component.html`**
```html
<li [class.completed]="todo.completed" 
    [class.editing]="isEditing"
    [class.loading]="isLoading">
  
  <!-- View Mode -->
  <div class="view" *ngIf="!isEditing">
    <input 
      class="toggle" 
      type="checkbox" 
      [checked]="todo.completed"
      [disabled]="isLoading"
      (click)="toggleTodo()"
      [attr.aria-label]="'Toggle todo: ' + todo.title"
    >
    <label (dblclick)="startEditing()">{{ todo.title }}</label>
    <button 
      class="destroy"
      [disabled]="isLoading"
      (click)="deleteTodo()"
      [attr.aria-label]="'Delete todo: ' + todo.title"
    ></button>
  </div>
  
  <!-- Edit Mode -->
  <input 
    *ngIf="isEditing"
    #editInput
    class="edit"
    [value]="editText"
    [disabled]="isLoading"
    (input)="editText = $any($event.target).value"
    (keyup.enter)="saveEdit()"
    (keyup.escape)="cancelEdit()"
    (blur)="saveEdit()"
    maxlength="500"
    [attr.aria-label]="'Edit todo: ' + todo.title"
  >
</li>
```

**`src/app/features/todos/components/todo-filter/todo-filter.component.ts`**
```typescript
@Component({
  selector: 'app-todo-filter',
  templateUrl: './todo-filter.component.html',
  styleUrls: ['./todo-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoFilterComponent implements OnInit {
  currentFilter$ = this.todoService.getCurrentFilter();
  
  filterOptions: FilterOption[] = [
    { key: TodoFilter.ALL, label: 'All', route: '#/' },
    { key: TodoFilter.ACTIVE, label: 'Active', route: '#/active' },
    { key: TodoFilter.COMPLETED, label: 'Completed', route: '#/completed' }
  ];
  
  constructor(
    private todoService: TodoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  ngOnInit(): void {
    // Listen to route changes for filter
    this.route.fragment.subscribe(fragment => {
      let filter: TodoFilter;
      switch (fragment) {
        case 'active':
          filter = TodoFilter.ACTIVE;
          break;
        case 'completed':
          filter = TodoFilter.COMPLETED;
          break;
        default:
          filter = TodoFilter.ALL;
      }
      this.todoService.setFilter(filter);
    });
  }
  
  setFilter(filter: TodoFilter, event: Event): void {
    event.preventDefault();
    
    // Update URL fragment
    const fragment = filter === TodoFilter.ALL ? null : filter;
    this.router.navigate([], { fragment });
  }
}
```

**`src/app/features/todos/components/todo-filter/todo-filter.component.html`**
```html
<ul class="filters">
  <li *ngFor="let filter of filterOptions">
    <a 
      [href]="filter.route"
      [class.selected]="(currentFilter$ | async) === filter.key"
      (click)="setFilter(filter.key, $event)"
      [attr.aria-label]="'Filter todos: ' + filter.label"
    >
      {{ filter.label }}
    </a>
  </li>
</ul>
```

**`src/app/features/todos/components/todo-counter/todo-counter.component.ts`**
```typescript
@Component({
  selector: 'app-todo-counter',
  template: `
    <span class="todo-count">
      <strong>{{ (stats$ | async)?.active || 0 }}</strong>
      {{ (stats$ | async)?.active | pluralize:'item':'items' }} left
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoCounterComponent {
  stats$ = this.todoService.getTodoStats();
  
  constructor(private todoService: TodoService) {}
}
```

**`src/app/features/todos/components/clear-completed/clear-completed.component.ts`**
```typescript
@Component({
  selector: 'app-clear-completed',
  template: `
    <button 
      class="clear-completed"
      *ngIf="(stats$ | async)?.completed > 0"
      (click)="clearCompleted()"
      [disabled]="isLoading"
    >
      Clear completed
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClearCompletedComponent {
  stats$ = this.todoService.getTodoStats();
  isLoading = false;
  
  constructor(
    private todoService: TodoService,
    private cdr: ChangeDetectorRef
  ) {}
  
  clearCompleted(): void {
    this.isLoading = true;
    this.todoService.clearCompleted().subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
```

#### 4. Shared Utilities

**`src/app/shared/pipes/pluralize.pipe.ts`**
```typescript
@Pipe({ name: 'pluralize' })
export class PluralizePipe implements PipeTransform {
  transform(count: number, singular: string, plural: string): string {
    return count === 1 ? singular : plural;
  }
}
```

**`src/app/shared/directives/auto-focus.directive.ts`**
```typescript
@Directive({
  selector: '[autoFocus]'
})
export class AutoFocusDirective implements AfterViewInit {
  constructor(private el: ElementRef) {}
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.el.nativeElement.focus();
    });
  }
}
```

#### 5. Configuration Files

**`proxy.conf.json`**
```json
{
  "/api/*": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

**`angular.json` (key sections)**
```json
{
  "serve": {
    "builder": "@angular-devkit/build-angular:dev-server",
    "options": {
      "proxyConfig": "proxy.conf.json",
      "port": 4200
    }
  },
  "build": {
    "options": {
      "outputPath": "dist/todo-frontend",
      "index": "src/index.html",
      "main": "src/main.ts",
      "polyfills": "src/polyfills.ts",
      "tsConfig": "tsconfig.app.json",
      "assets": [
        "src/favicon.ico",
        "src/assets"
      ],
      "styles": [
        "src/styles.css"
      ]
    }
  }
}
```

**`src/styles.css`**
```css
/* Import TodoMVC base styles */
@import './assets/main.css';

/* Global application styles */
body {
  font: 16px 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 300;
  line-height: 1.5;
  background: #fafafa;
  color: #353535;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Loading states */
.loading {
  opacity: 0.7;
  pointer-events: none;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #555;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .todoapp {
    margin: 0 20px;
  }
  
  .new-todo,
  .edit {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}
```

## Commands

### Angular CLI Commands

#### Initial Project Setup
```bash
# Create new Angular project
ng new todo-frontend --routing --style=css --package-manager=npm

cd todo-frontend

# Add required dependencies
npm install --save rxjs@^7.0.0
npm install --save-dev @types/node
```

#### Component Generation
```bash
# Generate feature module
ng generate module features/todos --routing

# Generate components
ng generate component features/todos/components/todo-app
ng generate component features/todos/components/todo-list  
ng generate component features/todos/components/todo-item
ng generate component features/todos/components/todo-filter
ng generate component features/todos/components/todo-counter
ng generate component features/todos/components/clear-completed

# Generate services
ng generate service core/services/todo
ng generate service core/services/ui-state
ng generate service core/services/notification
ng generate service core/services/http-client

# Generate interceptors
ng generate interceptor core/interceptors/error
ng generate interceptor core/interceptors/loading

# Generate pipes and directives
ng generate pipe shared/pipes/pluralize
ng generate directive shared/directives/auto-focus

# Generate guards
ng generate guard core/guards/todo
```

#### Development Commands
```bash
# Start development server with proxy
ng serve --proxy-config proxy.conf.json --port 4200

# Start with specific configuration
ng serve --configuration development --proxy-config proxy.conf.json

# Build for production
ng build --configuration production

# Build with stats for analysis
ng build --stats-json
npx webpack-bundle-analyzer dist/todo-frontend/stats.json
```

#### Testing Commands
```bash
# Run unit tests
ng test

# Run tests with coverage
ng test --code-coverage --watch=false

# Run tests in CI mode
ng test --watch=false --browsers=ChromeHeadless

# Run specific test files
ng test --include="**/todo.service.spec.ts"
ng test --include="**/components/**/*.spec.ts"

# Run e2e tests (after setup)
ng e2e
```

#### Linting and Code Quality
```bash
# Add ESLint (Angular 15+)
ng add @angular-eslint/schematics

# Run linting
ng lint

# Fix linting issues
ng lint --fix

# Format code with Prettier
npx prettier --write "src/**/*.{ts,html,css,scss,json}"
```

### Build and Deployment Commands
```bash
# Production build optimized
ng build --configuration production --optimization --build-optimizer

# Build and copy to Spring Boot static resources
ng build --configuration production --output-path="../todo-backend/src/main/resources/static"

# Analyze bundle size
ng build --stats-json && npx webpack-bundle-analyzer dist/todo-frontend/stats.json
```

## Testing

### Testing Strategy

#### 1. Unit Testing with Jasmine/Karma
- **Component Tests**: TestBed configuration with mock services
- **Service Tests**: HTTP client mocking with HttpClientTestingModule  
- **Pipe Tests**: Simple input/output testing
- **Directive Tests**: DOM manipulation verification

#### 2. Integration Testing
- **Component Integration**: Parent-child component interaction
- **Service Integration**: Service communication patterns
- **HTTP Integration**: API communication with mock backend

#### 3. End-to-End Testing with Cypress
- **User Workflows**: Complete todo management scenarios
- **Cross-browser Testing**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: Responsive design validation

### Test File Structure
```
src/app/
├── features/todos/components/
│   ├── todo-app/
│   │   ├── todo-app.component.spec.ts
│   │   └── todo-app.component.integration.spec.ts
│   ├── todo-list/todo-list.component.spec.ts
│   ├── todo-item/todo-item.component.spec.ts
│   ├── todo-filter/todo-filter.component.spec.ts
│   ├── todo-counter/todo-counter.component.spec.ts
│   └── clear-completed/clear-completed.component.spec.ts
├── core/services/
│   ├── todo.service.spec.ts
│   ├── ui-state.service.spec.ts
│   ├── notification.service.spec.ts
│   └── http-client.service.spec.ts
├── shared/pipes/
│   └── pluralize.pipe.spec.ts
├── shared/directives/
│   └── auto-focus.directive.spec.ts
└── e2e/
    ├── todo-app.e2e-spec.ts
    ├── todo-filter.e2e-spec.ts
    └── todo-crud.e2e-spec.ts
```

### Key Test Cases

#### Component Testing Example
```typescript
// todo-app.component.spec.ts
describe('TodoAppComponent', () => {
  let component: TodoAppComponent;
  let fixture: ComponentFixture<TodoAppComponent>;
  let todoService: jasmine.SpyObj<TodoService>;
  
  beforeEach(() => {
    const spy = jasmine.createSpyObj('TodoService', ['createTodo', 'getTodoStats']);
    
    TestBed.configureTestingModule({
      declarations: [TodoAppComponent],
      imports: [FormsModule],
      providers: [{ provide: TodoService, useValue: spy }]
    });
    
    fixture = TestBed.createComponent(TodoAppComponent);
    component = fixture.componentInstance;
    todoService = TestBed.inject(TodoService) as jasmine.SpyObj<TodoService>;
  });
  
  it('should create todo when enter is pressed', () => {
    component.newTodoTitle = 'Test Todo';
    todoService.createTodo.and.returnValue(of({ id: 1, title: 'Test Todo', completed: false }));
    
    component.createTodo();
    
    expect(todoService.createTodo).toHaveBeenCalledWith('Test Todo');
    expect(component.newTodoTitle).toBe('');
  });
  
  it('should not create empty todo', () => {
    component.newTodoTitle = '   ';
    
    component.createTodo();
    
    expect(todoService.createTodo).not.toHaveBeenCalled();
  });
});
```

#### Service Testing Example
```typescript
// todo.service.spec.ts
describe('TodoService', () => {
  let service: TodoService;
  let httpMock: HttpTestingController;
  
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
  
  it('should create todo with optimistic update', () => {
    const newTodo = { title: 'Test Todo' };
    const createdTodo = { id: 1, title: 'Test Todo', completed: false };
    
    service.createTodo(newTodo.title).subscribe();
    
    // Verify optimistic update
    service.getTodos().subscribe(todos => {
      expect(todos.length).toBe(1);
      expect(todos[0].title).toBe('Test Todo');
    });
    
    // Verify HTTP call
    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newTodo);
    
    req.flush(createdTodo);
  });
});
```

#### E2E Testing Example
```typescript
// cypress/integration/todo-app.spec.ts
describe('TodoMVC App', () => {
  beforeEach(() => {
    cy.visit('/');
  });
  
  it('should add new todo', () => {
    cy.get('.new-todo')
      .type('Learn Angular{enter}');
    
    cy.get('.todo-list li')
      .should('have.length', 1)
      .first()
      .should('contain', 'Learn Angular');
    
    cy.get('.todo-count')
      .should('contain', '1 item left');
  });
  
  it('should toggle todo completion', () => {
    cy.get('.new-todo').type('Test Todo{enter}');
    
    cy.get('.todo-list li .toggle').click();
    
    cy.get('.todo-list li')
      .should('have.class', 'completed');
    
    cy.get('.todo-count')
      .should('contain', '0 items left');
  });
  
  it('should filter todos', () => {
    // Add todos
    cy.get('.new-todo').type('Active Todo{enter}');
    cy.get('.new-todo').type('Completed Todo{enter}');
    
    // Complete one todo
    cy.get('.todo-list li').last().find('.toggle').click();
    
    // Test filters
    cy.get('.filters a').contains('Active').click();
    cy.get('.todo-list li').should('have.length', 1);
    cy.get('.todo-list li').should('contain', 'Active Todo');
    
    cy.get('.filters a').contains('Completed').click();
    cy.get('.todo-list li').should('have.length', 1);
    cy.get('.todo-list li').should('contain', 'Completed Todo');
  });
});
```

### Test Coverage Goals
- **Components**: >95% line coverage
- **Services**: 100% line coverage  
- **Integration**: All critical user paths
- **E2E**: All major workflows (CRUD, filtering, state management)

## Risks

### Technical Risks

#### 1. Performance Issues
**Risk**: Large todo lists (1000+ items) causing UI lag
**Mitigation**: 
- OnPush change detection strategy
- Virtual scrolling for large lists (CDK)
- Debounced filtering operations
- Efficient trackBy functions

#### 2. State Management Complexity
**Risk**: Complex state synchronization between components
**Mitigation**:
- Centralized state in TodoService with BehaviorSubject
- Immutable state updates
- Clear data flow patterns
- Comprehensive testing

#### 3. Memory Leaks
**Risk**: Subscription leaks causing memory issues
**Mitigation**:
- Subscription cleanup in ngOnDestroy
- takeUntil pattern for subscription management
- Memory profiling in development
- Automatic unsubscribe decorators

#### 4. HTTP Error Handling
**Risk**: Network failures causing poor user experience
**Mitigation**:
- Retry mechanisms with exponential backoff
- Optimistic updates with rollback
- Offline detection and graceful degradation
- User-friendly error messages

### Security Risks

#### 1. XSS Vulnerabilities
**Risk**: User input containing malicious scripts
**Mitigation**:
- Input sanitization in TodoService
- Angular's built-in XSS protection
- Content Security Policy headers
- Regular security audits

#### 2. Input Validation
**Risk**: Invalid or malicious data affecting application
**Mitigation**:
- Client-side validation with max length limits
- Server-side validation as primary defense
- HTML escaping for display
- Type-safe interfaces

### Browser Compatibility Risks

#### 1. Modern JavaScript Features
**Risk**: ES2020+ features not supported in older browsers
**Mitigation**:
- Browser compatibility testing
- Polyfills for missing features
- Progressive enhancement approach
- Clear browser support policy

#### 2. CSS Feature Support
**Risk**: CSS Grid/Flexbox issues in older browsers
**Mitigation**:
- CSS fallbacks for older browsers
- PostCSS with autoprefixer
- Progressive enhancement
- Cross-browser testing

### Development Workflow Risks

#### 1. Bundle Size Issues
**Risk**: Application bundle becoming too large
**Mitigation**:
- Tree shaking optimization
- Lazy loading for feature modules
- Bundle analysis tools
- Performance budgets

#### 2. Build Process Complexity
**Risk**: Complex build configuration causing deployment issues
**Mitigation**:
- Simple, standard Angular CLI configuration
- Docker-based development environment
- CI/CD pipeline validation
- Documentation of build process

## Conclusion

This comprehensive frontend plan provides a robust, scalable foundation for the TodoMVC application using Angular 17. The architecture emphasizes:

- **Modern Angular Patterns**: Standalone components, OnPush change detection, reactive programming
- **Performance Optimization**: Efficient state management, optimistic updates, memory leak prevention
- **User Experience**: Responsive design, accessibility, loading states, error handling
- **Code Quality**: TypeScript safety, comprehensive testing, clean architecture
- **Maintainability**: Clear separation of concerns, documented patterns, consistent structure

The implementation follows TodoMVC specifications exactly while incorporating enterprise-grade patterns for scalability and maintainability. The modular architecture allows for easy extension and modification as requirements evolve.

Key success factors:
1. Reactive state management with RxJS
2. Optimistic updates for immediate UI feedback
3. Comprehensive error handling and retry mechanisms
4. Accessibility-first design approach
5. Performance optimization from the start
6. Thorough testing strategy covering all layers

This plan serves as a complete blueprint for implementing a production-ready TodoMVC application that can serve as a foundation for larger, more complex applications.
