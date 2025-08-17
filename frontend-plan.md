# TodoMVC Angular Frontend Implementation Plan

## Context

This plan outlines the comprehensive frontend implementation for the TodoMVC application using Angular 17. The frontend will communicate with a Spring Boot backend via REST API and provide a modern, responsive user interface following TodoMVC specifications.

### Requirements Analysis
- **Framework**: Angular 17 with TypeScript
- **Styling**: Integration of existing TodoMVC CSS from `resources/css/main.css`
- **API Communication**: HTTP client for Spring Boot backend on port 8080
- **Development**: Port 4200 with proxy configuration
- **Features**: Full CRUD operations, filtering, toggle-all, clear completed
- **UI/UX**: TodoMVC standard interface with responsive design

## Architecture

### Module Structure
```
src/
├── app/
│   ├── core/                    # Core module (singleton services)
│   │   ├── services/
│   │   │   ├── todo.service.ts
│   │   │   └── error.service.ts
│   │   └── core.module.ts
│   ├── shared/                  # Shared module (common components/pipes)
│   │   ├── components/
│   │   ├── pipes/
│   │   └── shared.module.ts
│   ├── features/                # Feature modules
│   │   └── todos/
│   │       ├── components/
│   │       │   ├── todo-app/
│   │       │   ├── todo-list/
│   │       │   ├── todo-item/
│   │       │   └── todo-filter/
│   │       ├── models/
│   │       │   └── todo.interface.ts
│   │       └── todos.module.ts
│   ├── app.component.ts
│   ├── app.module.ts
│   └── app-routing.module.ts
├── assets/
├── environments/
└── styles.css                  # Global styles (TodoMVC CSS)
```

### Component Hierarchy
```
AppComponent
└── TodoAppComponent (todos feature)
    ├── TodoFilterComponent (filters: all/active/completed)
    └── TodoListComponent (main section)
        └── TodoItemComponent (individual todo items) [*ngFor]
```

### Data Flow
1. **Components** → **TodoService** → **HTTP Client** → **Spring Boot API**
2. **Optimistic Updates**: Immediate UI updates with rollback on API errors
3. **Error Handling**: Global error interceptor with user-friendly messages
4. **Loading States**: Spinner components during API operations

## Implementation

### 1. Project Setup and Configuration

#### Angular CLI Project Creation
```bash
ng new todo-frontend --routing --style=css --strict
cd todo-frontend
```

#### Proxy Configuration (`proxy.conf.json`)
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

#### Angular Configuration (`angular.json` updates)
```json
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

### 2. Core Models and Interfaces

#### `src/app/features/todos/models/todo.interface.ts`
```typescript
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
```

### 3. Core Services

#### `src/app/core/services/todo.service.ts`
```typescript
@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly apiUrl = '/api/todos';
  private todosSubject = new BehaviorSubject<Todo[]>([]);
  public todos$ = this.todosSubject.asObservable();

  constructor(private http: HttpClient) {}

  // CRUD Operations
  getTodos(): Observable<Todo[]>
  createTodo(title: string): Observable<Todo>
  updateTodo(id: number, updates: Partial<Todo>): Observable<Todo>
  deleteTodo(id: number): Observable<void>
  toggleTodo(id: number): Observable<Todo>
  clearCompleted(): Observable<void>

  // State Management
  private updateTodos(todos: Todo[]): void
  getStats(): Observable<TodoStats>
}
```

#### `src/app/core/services/error.service.ts`
```typescript
@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorSubject = new Subject<string>();
  public error$ = this.errorSubject.asObservable();

  handleError(error: any): void
  clearError(): void
}
```

### 4. HTTP Interceptors

#### `src/app/core/interceptors/error.interceptor.ts`
```typescript
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private errorService: ErrorService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.errorService.handleError(error);
        return throwError(() => error);
      })
    );
  }
}
```

#### `src/app/core/interceptors/loading.interceptor.ts`
```typescript
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private loadingCount = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>
}
```

### 5. Feature Components

#### `src/app/features/todos/components/todo-app/todo-app.component.ts`
```typescript
@Component({
  selector: 'app-todo-app',
  templateUrl: './todo-app.component.html',
  styleUrls: ['./todo-app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoAppComponent implements OnInit {
  todos$ = this.todoService.todos$;
  stats$ = this.todoService.getStats();
  currentFilter: TodoFilter = { type: 'all', label: 'All' };
  
  constructor(
    private todoService: TodoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.todoService.getTodos().subscribe();
  }

  onCreateTodo(title: string): void
  onFilterChange(filter: TodoFilter): void
  onToggleAll(): void
  onClearCompleted(): void
}
```

#### `src/app/features/todos/components/todo-app/todo-app.component.html`
```html
<section class="todoapp">
  <header class="header">
    <h1>todos</h1>
    <input 
      class="new-todo" 
      placeholder="What needs to be done?" 
      autofocus 
      #newTodoInput
      (keyup.enter)="onCreateTodo(newTodoInput.value); newTodoInput.value = ''"
      [disabled]="(loading$ | async)">
  </header>

  <section class="main" *ngIf="(stats$ | async)?.total > 0">
    <input 
      id="toggle-all" 
      class="toggle-all" 
      type="checkbox"
      [checked]="(stats$ | async)?.active === 0"
      (change)="onToggleAll()">
    <label for="toggle-all">Mark all as complete</label>
    
    <app-todo-list 
      [todos]="todos$ | async" 
      [filter]="currentFilter">
    </app-todo-list>
  </section>

  <footer class="footer" *ngIf="(stats$ | async)?.total > 0">
    <span class="todo-count">
      <strong>{{ (stats$ | async)?.active }}</strong>
      {{ (stats$ | async)?.active === 1 ? 'item' : 'items' }} left
    </span>
    
    <app-todo-filter 
      [currentFilter]="currentFilter" 
      (filterChange)="onFilterChange($event)">
    </app-todo-filter>
    
    <button 
      class="clear-completed" 
      *ngIf="(stats$ | async)?.completed > 0"
      (click)="onClearCompleted()">
      Clear completed
    </button>
  </footer>
</section>
```

#### `src/app/features/todos/components/todo-list/todo-list.component.ts`
```typescript
@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoListComponent {
  @Input() todos: Todo[] = [];
  @Input() filter: TodoFilter = { type: 'all', label: 'All' };

  get filteredTodos(): Todo[] {
    switch (this.filter.type) {
      case 'active':
        return this.todos.filter(todo => !todo.completed);
      case 'completed':
        return this.todos.filter(todo => todo.completed);
      default:
        return this.todos;
    }
  }

  trackByTodo(index: number, todo: Todo): number {
    return todo.id || index;
  }
}
```

#### `src/app/features/todos/components/todo-item/todo-item.component.ts`
```typescript
@Component({
  selector: 'app-todo-item',
  templateUrl: './todo-item.component.html',
  styleUrls: ['./todo-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoItemComponent {
  @Input() todo!: Todo;
  @Output() toggle = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();
  @Output() update = new EventEmitter<{id: number, title: string}>();

  isEditing = false;
  editingTitle = '';

  onToggle(): void {
    this.toggle.emit(this.todo.id);
  }

  onDelete(): void {
    this.delete.emit(this.todo.id);
  }

  startEditing(): void {
    this.isEditing = true;
    this.editingTitle = this.todo.title;
  }

  saveEdit(): void {
    const title = this.editingTitle.trim();
    if (title && title !== this.todo.title) {
      this.update.emit({ id: this.todo.id!, title });
    }
    this.isEditing = false;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingTitle = '';
  }

  @HostListener('keyup.enter')
  onEnter(): void {
    if (this.isEditing) {
      this.saveEdit();
    }
  }

  @HostListener('keyup.escape')
  onEscape(): void {
    this.cancelEdit();
  }
}
```

#### `src/app/features/todos/components/todo-filter/todo-filter.component.ts`
```typescript
@Component({
  selector: 'app-todo-filter',
  templateUrl: './todo-filter.component.html',
  styleUrls: ['./todo-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoFilterComponent {
  @Input() currentFilter!: TodoFilter;
  @Output() filterChange = new EventEmitter<TodoFilter>();

  filters: TodoFilter[] = [
    { type: 'all', label: 'All' },
    { type: 'active', label: 'Active' },
    { type: 'completed', label: 'Completed' }
  ];

  onFilterSelect(filter: TodoFilter): void {
    this.filterChange.emit(filter);
  }
}
```

### 6. Shared Pipes

#### `src/app/shared/pipes/pluralize.pipe.ts`
```typescript
@Pipe({ name: 'pluralize' })
export class PluralizePipe implements PipeTransform {
  transform(count: number, singular: string, plural?: string): string {
    if (count === 1) {
      return `${count} ${singular}`;
    }
    return `${count} ${plural || singular + 's'}`;
  }
}
```

### 7. CSS Integration

#### `src/styles.css` (Global TodoMVC Styles)
```css
/* Import existing TodoMVC CSS from resources/css/main.css */
@import './assets/css/main.css';

/* TodoMVC specific styles */
.todoapp {
  background: #fff;
  margin: 130px 0 40px 0;
  position: relative;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2),
              0 25px 50px 0 rgba(0, 0, 0, 0.1);
}

/* Additional TodoMVC styling... */
```

### 8. Module Configuration

#### `src/app/features/todos/todos.module.ts`
```typescript
@NgModule({
  declarations: [
    TodoAppComponent,
    TodoListComponent,
    TodoItemComponent,
    TodoFilterComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    TodoAppComponent
  ]
})
export class TodosModule { }
```

#### `src/app/core/core.module.ts`
```typescript
@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only once.');
    }
  }
}
```

## Commands

### Angular CLI Commands for Initial Setup
```bash
# 1. Create new Angular project
ng new todo-frontend --routing --style=css --strict
cd todo-frontend

# 2. Generate feature modules
ng generate module features/todos --route todos --module app
ng generate module core
ng generate module shared

# 3. Generate components
ng generate component features/todos/components/todo-app --module features/todos
ng generate component features/todos/components/todo-list --module features/todos
ng generate component features/todos/components/todo-item --module features/todos
ng generate component features/todos/components/todo-filter --module features/todos

# 4. Generate services
ng generate service core/services/todo
ng generate service core/services/error

# 5. Generate interceptors
ng generate interceptor core/interceptors/error
ng generate interceptor core/interceptors/loading

# 6. Generate interfaces
ng generate interface features/todos/models/todo

# 7. Generate pipes
ng generate pipe shared/pipes/pluralize --module shared

# 8. Install additional dependencies
npm install @angular/material @angular/cdk
npm install --save-dev @types/jasmine @types/node
```

### Development Commands
```bash
# Start development server with proxy
ng serve --proxy-config proxy.conf.json

# Build for production
ng build --configuration production

# Run unit tests
ng test

# Run e2e tests
ng e2e

# Lint code
ng lint

# Generate code coverage
ng test --code-coverage
```

### Package Dependencies
```json
{
  "dependencies": {
    "@angular/animations": "^17.0.0",
    "@angular/common": "^17.0.0",
    "@angular/compiler": "^17.0.0",
    "@angular/core": "^17.0.0",
    "@angular/forms": "^17.0.0",
    "@angular/platform-browser": "^17.0.0",
    "@angular/platform-browser-dynamic": "^17.0.0",
    "@angular/router": "^17.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^17.0.0",
    "@angular/cli": "^17.0.0",
    "@angular/compiler-cli": "^17.0.0",
    "@types/jasmine": "~5.1.0",
    "@types/node": "^18.7.0",
    "jasmine-core": "~5.1.0",
    "karma": "~6.4.0",
    "karma-chrome-headless": "~3.1.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "~5.2.0"
  }
}
```

## Testing

### Testing Strategy

#### Unit Testing Approach
- **Components**: Test user interactions, event emissions, and template rendering
- **Services**: Test HTTP calls, state management, and business logic
- **Pipes**: Test transformation logic with various inputs
- **Interceptors**: Test request/response handling and error management

#### Test File Structure
```
src/
├── app/
│   ├── features/todos/
│   │   ├── components/
│   │   │   ├── todo-app/
│   │   │   │   ├── todo-app.component.spec.ts
│   │   │   │   └── todo-app.component.ts
│   │   │   ├── todo-item/
│   │   │   │   ├── todo-item.component.spec.ts
│   │   │   │   └── todo-item.component.ts
│   │   ├── services/
│   │   │   └── todo.service.spec.ts
│   │   └── models/
│   │       └── todo.interface.spec.ts
└── e2e/
    ├── src/
    │   ├── app.e2e-spec.ts
    │   ├── todo-crud.e2e-spec.ts
    │   └── todo-filtering.e2e-spec.ts
```

#### Key Test Scenarios

**Component Tests (todo-app.component.spec.ts)**
```typescript
describe('TodoAppComponent', () => {
  let component: TodoAppComponent;
  let fixture: ComponentFixture<TodoAppComponent>;
  let todoService: jasmine.SpyObj<TodoService>;

  beforeEach(() => {
    const todoServiceSpy = jasmine.createSpyObj('TodoService', ['getTodos', 'createTodo']);
    
    TestBed.configureTestingModule({
      declarations: [TodoAppComponent],
      providers: [
        { provide: TodoService, useValue: todoServiceSpy }
      ]
    });
    
    fixture = TestBed.createComponent(TodoAppComponent);
    component = fixture.componentInstance;
    todoService = TestBed.inject(TodoService) as jasmine.SpyObj<TodoService>;
  });

  it('should create todo when enter is pressed', () => {
    // Test implementation
  });

  it('should filter todos correctly', () => {
    // Test implementation
  });

  it('should toggle all todos', () => {
    // Test implementation
  });
});
```

**Service Tests (todo.service.spec.ts)**
```typescript
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

  it('should create todo via POST request', () => {
    const mockTodo: Todo = { id: 1, title: 'Test Todo', completed: false };
    
    service.createTodo('Test Todo').subscribe(todo => {
      expect(todo).toEqual(mockTodo);
    });

    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('POST');
    req.flush(mockTodo);
  });

  afterEach(() => {
    httpMock.verify();
  });
});
```

**E2E Tests (app.e2e-spec.ts)**
```typescript
describe('TodoMVC App', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display todo input on load', () => {
    cy.get('.new-todo').should('be.visible').and('be.focused');
  });

  it('should create and display new todo', () => {
    cy.get('.new-todo').type('Buy groceries{enter}');
    cy.get('.todo-list li').should('have.length', 1);
    cy.get('.todo-list li label').should('contain', 'Buy groceries');
  });

  it('should toggle todo completion', () => {
    cy.get('.new-todo').type('Test todo{enter}');
    cy.get('.toggle').click();
    cy.get('.todo-list li').should('have.class', 'completed');
  });

  it('should filter todos correctly', () => {
    // Create test todos
    cy.get('.new-todo').type('Active todo{enter}');
    cy.get('.new-todo').type('Completed todo{enter}');
    
    // Complete second todo
    cy.get('.todo-list li').eq(1).find('.toggle').click();
    
    // Test filtering
    cy.get('[href="#/active"]').click();
    cy.get('.todo-list li').should('have.length', 1);
    
    cy.get('[href="#/completed"]').click();
    cy.get('.todo-list li').should('have.length', 1);
  });
});
```

#### Test Coverage Goals
- **Components**: 90%+ line coverage
- **Services**: 95%+ line coverage
- **Critical user flows**: 100% E2E coverage
- **Error scenarios**: Comprehensive error handling tests

### Testing Tools Configuration

#### Karma Configuration (karma.conf.js)
```javascript
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-headless'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly' }
      ]
    },
    browsers: ['ChromeHeadless'],
    singleRun: true
  });
};
```

## Risks

### Performance Considerations
- **Large Todo Lists**: Implement virtual scrolling for 1000+ items
- **Change Detection**: Use OnPush strategy and immutable state updates
- **Bundle Size**: Lazy load modules and tree-shake unused code
- **Memory Leaks**: Proper subscription management with takeUntil pattern

### Compatibility Issues
- **Browser Support**: Modern browsers only (ES2020+)
- **Mobile Responsive**: Ensure touch-friendly interactions
- **Accessibility**: ARIA labels and keyboard navigation
- **API Compatibility**: Handle backend API changes gracefully

### Development Risks
- **Proxy Configuration**: Backend connection issues during development
- **State Management**: Complex state synchronization between components
- **Error Handling**: Comprehensive error boundary implementation
- **Testing Complexity**: Mocking HTTP calls and component interactions

### Mitigation Strategies
- **Progressive Enhancement**: Basic functionality without JavaScript
- **Offline Support**: Service worker for basic offline functionality
- **Error Recovery**: Automatic retry mechanisms and user feedback
- **Performance Monitoring**: Bundle analysis and runtime performance tracking

## Development Workflow

### 1. Initial Setup Phase
```bash
# Setup Angular project with proxy
ng new todo-frontend --routing --style=css --strict
cd todo-frontend
# Configure proxy.conf.json
# Copy TodoMVC CSS to assets
ng serve --proxy-config proxy.conf.json
```

### 2. Core Implementation Phase
```bash
# Generate core services and interceptors
ng generate service core/services/todo
ng generate interceptor core/interceptors/error
# Implement HTTP client and error handling
```

### 3. Component Development Phase
```bash
# Generate components following hierarchy
ng generate component features/todos/components/todo-app
# Implement template and component logic
# Add unit tests for each component
```

### 4. Integration Testing Phase
```bash
# Run unit tests
ng test --code-coverage
# Setup E2E tests
ng e2e
# Test with backend integration
```

### 5. Production Preparation
```bash
# Build optimized bundle
ng build --configuration production
# Analyze bundle size
npx webpack-bundle-analyzer dist/todo-frontend/main.*.js
# Performance testing and optimization
```

This comprehensive plan provides a solid foundation for implementing the TodoMVC Angular frontend with modern best practices, comprehensive testing, and production-ready architecture.
