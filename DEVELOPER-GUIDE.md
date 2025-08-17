# TodoMVC Developer Guide

## Overview

This comprehensive developer guide provides everything needed to understand, contribute to, and extend the TodoMVC application. The application demonstrates modern full-stack development with Spring Boot backend and Angular frontend.

### Architecture at a Glance

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Storage       │
│   Angular 17    │◄──►│   Spring Boot   │◄──►│   In-Memory     │
│   Port 4200     │    │   Port 8080     │    │   Thread-Safe   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Backend**:
- **Framework**: Spring Boot 3.2.0
- **Java**: 17 (LTS)
- **Build Tool**: Maven 3.9+
- **Testing**: JUnit 5, Spring Boot Test
- **Documentation**: JavaDoc, Spring REST Docs

**Frontend**:
- **Framework**: Angular 17
- **Language**: TypeScript 5.2+
- **Build Tool**: Angular CLI
- **Testing**: Jasmine, Karma, Cypress
- **Styling**: CSS3, CSS Grid, Flexbox

**Development Tools**:
- **IDE**: VS Code, IntelliJ IDEA
- **Version Control**: Git
- **Package Management**: npm, Maven
- **Documentation**: Markdown, TypeDoc

## Project Structure

### Repository Layout

```
todo-mvc/
├── todo-backend/                 # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/todobackend/
│   │   │   │   ├── TodoBackendApplication.java
│   │   │   │   ├── config/       # Configuration classes
│   │   │   │   ├── controller/   # REST controllers
│   │   │   │   ├── service/      # Business logic
│   │   │   │   ├── model/        # Entity models
│   │   │   │   ├── dto/          # Data transfer objects
│   │   │   │   ├── mapper/       # Object mapping
│   │   │   │   ├── exception/    # Exception handling
│   │   │   │   └── security/     # Security utilities
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       ├── application-dev.properties
│   │   │       ├── application-prod.properties
│   │   │       └── static/       # Frontend build artifacts
│   │   └── test/                 # Test classes
│   ├── pom.xml                   # Maven dependencies
│   └── target/                   # Build artifacts
│
├── todo-frontend/                # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/             # Core services and utilities
│   │   │   ├── features/         # Feature modules
│   │   │   │   └── todos/
│   │   │   │       ├── components/
│   │   │   │       ├── models/
│   │   │   │       └── services/
│   │   │   ├── shared/           # Shared components
│   │   │   ├── app.component.*   # Root component
│   │   │   └── app.config.ts     # App configuration
│   │   ├── assets/               # Static assets
│   │   └── styles.css            # Global styles
│   ├── angular.json              # Angular configuration
│   ├── package.json              # npm dependencies
│   └── proxy.conf.json           # Development proxy
│
├── docs/                         # Documentation
│   ├── API-DOCUMENTATION.md
│   ├── USER-GUIDE.md
│   └── DEVELOPER-GUIDE.md
│
└── scripts/                      # Build and deployment scripts
    ├── build-production.sh
    ├── deploy.sh
    └── test-all.sh
```

## Development Environment Setup

### Prerequisites

**Required Software**:
- **Java**: OpenJDK 17 or higher
- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Maven**: 3.9 or higher
- **Git**: Latest version

**Recommended IDE Extensions**:
```json
{
  "recommendations": [
    "ms-vscode.vscode-java-pack",
    "angular.ng-template",
    "ms-vscode.vscode-typescript-next",
    "redhat.java",
    "pivotal.vscode-spring-boot"
  ]
}
```

### Initial Setup

#### 1. Clone and Setup Repository
```bash
# Clone repository
git clone <repository-url>
cd todo-mvc

# Setup backend
cd todo-backend
mvn clean install

# Setup frontend
cd ../todo-frontend
npm install

# Return to root
cd ..
```

#### 2. IDE Configuration

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "java.home": "/path/to/java-17",
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-17",
      "path": "/path/to/java-17"
    }
  ],
  "typescript.preferences.importModuleSpecifier": "relative",
  "angular.enable-strict-mode-prompt": false,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

#### 3. Environment Variables

**Development Environment** (`.env.development`):
```bash
# Backend configuration
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:4200

# Frontend configuration
NG_PORT=4200
NG_PROXY_CONFIG=proxy.conf.json
```

### Running the Application

#### Development Mode

**Terminal 1 - Backend**:
```bash
cd todo-backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Terminal 2 - Frontend**:
```bash
cd todo-frontend
ng serve --proxy-config proxy.conf.json
```

**Access Points**:
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080/api
- Health Check: http://localhost:8080/actuator/health

#### Production Mode

```bash
# Build and run production version
./scripts/build-production.sh
java -jar build-artifacts/todo-app-*.jar --spring.profiles.active=prod
```

## Backend Development

### Architecture Patterns

#### Layered Architecture
```
┌─────────────────────────────────────────┐
│           Controller Layer              │ ← REST endpoints
├─────────────────────────────────────────┤
│            Service Layer                │ ← Business logic
├─────────────────────────────────────────┤
│           Repository Layer              │ ← Data access
├─────────────────────────────────────────┤
│             Model Layer                 │ ← Domain entities
└─────────────────────────────────────────┘
```

#### Dependency Injection
```java
@RestController
@RequestMapping("/api/todos")
public class TodoController {
    
    private final TodoService todoService;
    
    // Constructor injection (recommended)
    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }
}
```

### Key Components

#### 1. Todo Model
```java
/**
 * Core Todo entity representing a todo item.
 * Thread-safe when used with synchronized collections.
 */
public class Todo {
    private Long id;                    // Unique identifier
    private String title;               // Todo title (1-500 chars)
    private boolean completed;          // Completion status
    private LocalDateTime createdAt;    // Creation timestamp
    private LocalDateTime updatedAt;    // Last update timestamp
    
    // Constructors, getters, setters, equals, hashCode
}
```

#### 2. TodoService
```java
/**
 * Main business logic service for todo operations.
 * Handles validation, business rules, and data transformation.
 */
@Service
public class TodoService {
    
    private final TodoStorageService storageService;
    private final TodoMapper todoMapper;
    
    /**
     * Retrieves all todos in the system.
     * @return List of TodoResponse objects
     */
    public List<TodoResponse> getAllTodos() {
        List<Todo> todos = storageService.getAllTodos();
        return todoMapper.toResponseList(todos);
    }
    
    /**
     * Creates a new todo with validation.
     * @param request Create todo request
     * @return Created todo response
     * @throws ValidationException if validation fails
     */
    @Transactional
    public TodoResponse createTodo(CreateTodoRequest request) {
        // Validation logic
        validateTodoRequest(request);
        
        // Create and save todo
        Todo todo = new Todo();
        todo.setTitle(request.getTitle().trim());
        todo.setCompleted(false);
        todo.setCreatedAt(LocalDateTime.now());
        todo.setUpdatedAt(LocalDateTime.now());
        
        Todo savedTodo = storageService.save(todo);
        return todoMapper.toResponse(savedTodo);
    }
}
```

#### 3. TodoStorageService
```java
/**
 * Thread-safe in-memory storage service.
 * Uses synchronized collections for concurrent access.
 */
@Service
public class TodoStorageService {
    
    private final List<Todo> todos = Collections.synchronizedList(new ArrayList<>());
    private final AtomicLong idGenerator = new AtomicLong(1);
    
    /**
     * Thread-safe todo retrieval.
     * @return Synchronized list of todos
     */
    public List<Todo> getAllTodos() {
        synchronized (todos) {
            return new ArrayList<>(todos);
        }
    }
    
    /**
     * Thread-safe todo creation with ID generation.
     * @param todo Todo to save
     * @return Saved todo with generated ID
     */
    public Todo save(Todo todo) {
        if (todo.getId() == null) {
            todo.setId(idGenerator.getAndIncrement());
        }
        
        synchronized (todos) {
            todos.add(todo);
        }
        
        return todo;
    }
}
```

### Testing Strategy

#### Unit Testing
```java
@ExtendWith(MockitoExtension.class)
class TodoServiceTest {
    
    @Mock
    private TodoStorageService storageService;
    
    @Mock
    private TodoMapper todoMapper;
    
    @InjectMocks
    private TodoService todoService;
    
    @Test
    @DisplayName("Should create todo successfully with valid input")
    void shouldCreateTodoSuccessfully() {
        // Given
        CreateTodoRequest request = new CreateTodoRequest("Test Todo");
        Todo mockTodo = new Todo();
        mockTodo.setId(1L);
        mockTodo.setTitle("Test Todo");
        
        when(storageService.save(any(Todo.class))).thenReturn(mockTodo);
        when(todoMapper.toResponse(mockTodo)).thenReturn(new TodoResponse(1L, "Test Todo", false));
        
        // When
        TodoResponse response = todoService.createTodo(request);
        
        // Then
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getTitle()).isEqualTo("Test Todo");
        verify(storageService).save(any(Todo.class));
    }
}
```

#### Integration Testing
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class TodoControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    @DisplayName("Should handle complete CRUD workflow")
    void shouldHandleCompleteCrudWorkflow() {
        // Create todo
        CreateTodoRequest createRequest = new CreateTodoRequest("Integration Test Todo");
        ResponseEntity<TodoResponse> createResponse = restTemplate.postForEntity(
            "/api/todos", createRequest, TodoResponse.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long todoId = createResponse.getBody().getId();
        
        // Read todo
        ResponseEntity<TodoResponse> getResponse = restTemplate.getForEntity(
            "/api/todos/" + todoId, TodoResponse.class);
        
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody().getTitle()).isEqualTo("Integration Test Todo");
        
        // Update todo
        UpdateTodoRequest updateRequest = new UpdateTodoRequest("Updated Todo", true);
        restTemplate.put("/api/todos/" + todoId, updateRequest);
        
        // Delete todo
        restTemplate.delete("/api/todos/" + todoId);
        
        // Verify deletion
        ResponseEntity<TodoResponse> deletedResponse = restTemplate.getForEntity(
            "/api/todos/" + todoId, TodoResponse.class);
        assertThat(deletedResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
```

### Performance Considerations

#### Thread Safety
```java
/**
 * Thread-safe counter implementation using AtomicLong.
 */
@Component
public class TodoCounter {
    
    private final AtomicLong activeCount = new AtomicLong(0);
    private final AtomicLong totalCount = new AtomicLong(0);
    
    public void incrementActive() {
        activeCount.incrementAndGet();
        totalCount.incrementAndGet();
    }
    
    public void decrementActive() {
        activeCount.decrementAndGet();
    }
    
    public long getActiveCount() {
        return activeCount.get();
    }
}
```

#### Validation Performance
```java
/**
 * Optimized validation using Bean Validation.
 */
@Component
public class TodoValidator {
    
    private final Validator validator;
    
    public void validateCreateRequest(CreateTodoRequest request) {
        Set<ConstraintViolation<CreateTodoRequest>> violations = validator.validate(request);
        
        if (!violations.isEmpty()) {
            throw new ValidationException(buildErrorMessage(violations));
        }
    }
    
    private String buildErrorMessage(Set<ConstraintViolation<CreateTodoRequest>> violations) {
        return violations.stream()
            .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
            .collect(Collectors.joining(", "));
    }
}
```

## Frontend Development

### Architecture Patterns

#### Feature Module Structure
```typescript
// features/todos/todos.module.ts
@NgModule({
  declarations: [
    TodoAppComponent,
    TodoListComponent,
    TodoItemComponent,
    TodoFilterComponent,
    TodoCounterComponent,
    ToggleAllComponent,
    ClearCompletedComponent
  ],
  imports: [
    CommonModule,
    TodosRoutingModule,
    ReactiveFormsModule,
    SharedModule
  ],
  providers: [
    TodoService,
    UIStateService
  ]
})
export class TodosModule { }
```

#### Service Architecture
```typescript
/**
 * Core todo service with reactive patterns and error handling.
 */
@Injectable({
  providedIn: 'root'
})
export class TodoService {
  
  private readonly baseUrl = '/api/todos';
  private readonly todosSubject = new BehaviorSubject<Todo[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  
  // Public observables
  public readonly todos$ = this.todosSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();
  
  // Derived observables
  public readonly activeTodos$ = this.todos$.pipe(
    map(todos => todos.filter(todo => !todo.completed))
  );
  
  public readonly completedTodos$ = this.todos$.pipe(
    map(todos => todos.filter(todo => todo.completed))
  );
  
  public readonly activeCount$ = this.activeTodos$.pipe(
    map(todos => todos.length)
  );
}
```

### Key Components

#### 1. TodoAppComponent
```typescript
/**
 * Root component managing the overall todo application state.
 */
@Component({
  selector: 'app-todo-app',
  templateUrl: './todo-app.component.html',
  styleUrls: ['./todo-app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoAppComponent implements OnInit, OnDestroy {
  
  // Reactive properties
  todos$ = this.todoService.todos$;
  loading$ = this.todoService.loading$;
  error$ = this.todoService.error$;
  hasTodos$ = this.todos$.pipe(map(todos => todos.length > 0));
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private todoService: TodoService,
    private uiStateService: UIStateService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    // Load initial todos
    this.loadTodos();
    
    // Setup error handling
    this.setupErrorHandling();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Creates a new todo with optimistic updates.
   */
  onTodoCreate(title: string): void {
    if (!title.trim()) {
      return;
    }
    
    this.todoService.createTodo(title).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.handleError('Failed to create todo', error);
        return EMPTY;
      })
    ).subscribe();
  }
  
  private loadTodos(): void {
    this.todoService.loadTodos().pipe(
      takeUntil(this.destroy$)
    ).subscribe();
  }
  
  private setupErrorHandling(): void {
    this.error$.pipe(
      filter(error => !!error),
      takeUntil(this.destroy$)
    ).subscribe(error => {
      console.error('Todo application error:', error);
      // Could integrate with notification service
    });
  }
}
```

#### 2. TodoService with Optimistic Updates
```typescript
/**
 * Enhanced todo service with optimistic updates and error recovery.
 */
@Injectable({
  providedIn: 'root'
})
export class TodoService {
  
  /**
   * Creates a todo with optimistic update and rollback on error.
   */
  createTodo(title: string): Observable<Todo> {
    const optimisticTodo: Todo = {
      id: Date.now(), // Temporary ID
      title: title.trim(),
      completed: false
    };
    
    // Optimistic update
    const currentTodos = this.todosSubject.value;
    this.todosSubject.next([...currentTodos, optimisticTodo]);
    
    return this.http.post<Todo>(this.baseUrl, { title }).pipe(
      tap(createdTodo => {
        // Replace optimistic todo with real todo
        const todos = this.todosSubject.value;
        const index = todos.findIndex(t => t.id === optimisticTodo.id);
        if (index !== -1) {
          todos[index] = createdTodo;
          this.todosSubject.next([...todos]);
        }
      }),
      catchError(error => {
        // Rollback optimistic update
        const todos = this.todosSubject.value;
        const filteredTodos = todos.filter(t => t.id !== optimisticTodo.id);
        this.todosSubject.next(filteredTodos);
        
        this.handleError('Failed to create todo', error);
        return throwError(() => error);
      }),
      retry(2), // Retry up to 2 times
      finalize(() => this.loadingSubject.next(false))
    );
  }
  
  /**
   * Updates a todo with optimistic updates.
   */
  updateTodo(id: number, updates: Partial<Todo>): Observable<Todo> {
    // Store original state for rollback
    const currentTodos = this.todosSubject.value;
    const originalTodo = currentTodos.find(t => t.id === id);
    
    if (!originalTodo) {
      return throwError(() => new Error('Todo not found'));
    }
    
    // Optimistic update
    const optimisticTodos = currentTodos.map(todo =>
      todo.id === id ? { ...todo, ...updates } : todo
    );
    this.todosSubject.next(optimisticTodos);
    
    return this.http.put<Todo>(`${this.baseUrl}/${id}`, updates).pipe(
      tap(updatedTodo => {
        // Confirm update with server response
        const todos = this.todosSubject.value;
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
          todos[index] = updatedTodo;
          this.todosSubject.next([...todos]);
        }
      }),
      catchError(error => {
        // Rollback to original state
        this.todosSubject.next(currentTodos);
        this.handleError('Failed to update todo', error);
        return throwError(() => error);
      }),
      retry(2)
    );
  }
}
```

#### 3. Form Handling
```typescript
/**
 * Todo creation form with validation.
 */
@Component({
  selector: 'app-todo-input',
  template: `
    <form [formGroup]="todoForm" (ngSubmit)="onSubmit()">
      <input
        formControlName="title"
        placeholder="What needs to be done?"
        autofocus
        [class.error]="titleControl.invalid && titleControl.touched"
      >
      <div *ngIf="titleControl.invalid && titleControl.touched" class="error-message">
        <span *ngIf="titleControl.errors?.['required']">Title is required</span>
        <span *ngIf="titleControl.errors?.['maxlength']">Title is too long</span>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoInputComponent {
  
  @Output() todoCreate = new EventEmitter<string>();
  
  todoForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(500)]]
  });
  
  get titleControl() {
    return this.todoForm.get('title')!;
  }
  
  constructor(private fb: FormBuilder) {}
  
  onSubmit(): void {
    if (this.todoForm.valid) {
      const title = this.titleControl.value!.trim();
      if (title) {
        this.todoCreate.emit(title);
        this.todoForm.reset();
      }
    } else {
      this.titleControl.markAsTouched();
    }
  }
}
```

### Testing Strategy

#### Unit Testing
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
  
  afterEach(() => {
    httpMock.verify();
  });
  
  describe('createTodo', () => {
    it('should create todo with optimistic update', () => {
      const title = 'Test Todo';
      const mockResponse: Todo = { id: 1, title, completed: false };
      
      // Start with empty state
      expect(service.todosSubject.value).toEqual([]);
      
      // Call service method
      service.createTodo(title).subscribe();
      
      // Verify optimistic update
      expect(service.todosSubject.value.length).toBe(1);
      expect(service.todosSubject.value[0].title).toBe(title);
      
      // Respond to HTTP request
      const req = httpMock.expectOne('/api/todos');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
      
      // Verify final state
      expect(service.todosSubject.value[0]).toEqual(mockResponse);
    });
    
    it('should rollback on error', () => {
      const title = 'Test Todo';
      
      service.createTodo(title).subscribe({
        error: () => {} // Handle error
      });
      
      // Verify optimistic update
      expect(service.todosSubject.value.length).toBe(1);
      
      // Simulate error
      const req = httpMock.expectOne('/api/todos');
      req.error(new ErrorEvent('Network error'));
      
      // Verify rollback
      expect(service.todosSubject.value).toEqual([]);
    });
  });
});
```

#### Component Testing
```typescript
describe('TodoAppComponent', () => {
  let component: TodoAppComponent;
  let fixture: ComponentFixture<TodoAppComponent>;
  let todoService: jasmine.SpyObj<TodoService>;
  
  beforeEach(() => {
    const todoServiceSpy = jasmine.createSpyObj('TodoService', ['loadTodos', 'createTodo']);
    
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
  
  it('should load todos on init', () => {
    todoService.loadTodos.and.returnValue(of([]));
    
    component.ngOnInit();
    
    expect(todoService.loadTodos).toHaveBeenCalled();
  });
  
  it('should create todo when valid title provided', () => {
    const title = 'Test Todo';
    todoService.createTodo.and.returnValue(of({ id: 1, title, completed: false }));
    
    component.onTodoCreate(title);
    
    expect(todoService.createTodo).toHaveBeenCalledWith(title);
  });
  
  it('should not create todo when empty title provided', () => {
    component.onTodoCreate('   ');
    
    expect(todoService.createTodo).not.toHaveBeenCalled();
  });
});
```

## Testing Guidelines

### Testing Philosophy

1. **Test Pyramid**: Many unit tests, some integration tests, few E2E tests
2. **Test Behavior**: Focus on behavior over implementation
3. **Test Coverage**: Aim for 80%+ code coverage with meaningful tests
4. **Test Performance**: Tests should run quickly and reliably

### Backend Testing

#### Test Categories
```java
// Unit tests - fast, isolated
@ExtendWith(MockitoExtension.class)
class TodoServiceTest { }

// Integration tests - test component interaction
@SpringBootTest
class TodoServiceIntegrationTest { }

// Web layer tests - test REST endpoints
@WebMvcTest(TodoController.class)
class TodoControllerTest { }

// Full integration tests - test complete application
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class TodoApplicationIntegrationTest { }
```

#### Test Utilities
```java
/**
 * Test data builder for consistent test data creation.
 */
public class TodoTestDataBuilder {
    
    private Long id = 1L;
    private String title = "Default Todo";
    private boolean completed = false;
    
    public static TodoTestDataBuilder aTodo() {
        return new TodoTestDataBuilder();
    }
    
    public TodoTestDataBuilder withId(Long id) {
        this.id = id;
        return this;
    }
    
    public TodoTestDataBuilder withTitle(String title) {
        this.title = title;
        return this;
    }
    
    public TodoTestDataBuilder completed() {
        this.completed = true;
        return this;
    }
    
    public Todo build() {
        Todo todo = new Todo();
        todo.setId(id);
        todo.setTitle(title);
        todo.setCompleted(completed);
        todo.setCreatedAt(LocalDateTime.now());
        todo.setUpdatedAt(LocalDateTime.now());
        return todo;
    }
    
    public CreateTodoRequest buildCreateRequest() {
        return new CreateTodoRequest(title);
    }
}

// Usage in tests
@Test
void shouldCreateCompletedTodo() {
    Todo todo = aTodo().withTitle("Test Todo").completed().build();
    // ... test logic
}
```

### Frontend Testing

#### Testing Utilities
```typescript
/**
 * Test utilities for consistent component testing.
 */
export class TodoTestUtils {
  
  static createMockTodo(overrides: Partial<Todo> = {}): Todo {
    return {
      id: 1,
      title: 'Test Todo',
      completed: false,
      ...overrides
    };
  }
  
  static createMockTodos(count: number): Todo[] {
    return Array.from({ length: count }, (_, i) => 
      this.createMockTodo({ id: i + 1, title: `Todo ${i + 1}` })
    );
  }
  
  static mockTodoService(): jasmine.SpyObj<TodoService> {
    return jasmine.createSpyObj('TodoService', [
      'loadTodos',
      'createTodo',
      'updateTodo',
      'deleteTodo',
      'toggleTodo'
    ], {
      todos$: of([]),
      loading$: of(false),
      error$: of(null)
    });
  }
}
```

#### E2E Testing
```typescript
// cypress/integration/todo-app.spec.ts
describe('TodoMVC Application', () => {
  
  beforeEach(() => {
    cy.visit('/');
    cy.intercept('GET', '/api/todos', []).as('loadTodos');
  });
  
  it('should create and manage todos', () => {
    // Create todo
    cy.get('[data-cy=todo-input]').type('Learn Cypress{enter}');
    cy.get('[data-cy=todo-item]').should('contain', 'Learn Cypress');
    
    // Toggle completion
    cy.get('[data-cy=todo-checkbox]').click();
    cy.get('[data-cy=todo-item]').should('have.class', 'completed');
    
    // Edit todo
    cy.get('[data-cy=todo-label]').dblclick();
    cy.get('[data-cy=todo-edit-input]').clear().type('Learn Cypress E2E{enter}');
    cy.get('[data-cy=todo-item]').should('contain', 'Learn Cypress E2E');
    
    // Delete todo
    cy.get('[data-cy=todo-destroy]').click({ force: true });
    cy.get('[data-cy=todo-item]').should('not.exist');
  });
  
  it('should filter todos correctly', () => {
    // Create todos
    cy.createTodos(['Active Todo', 'Completed Todo']);
    cy.toggleTodo('Completed Todo');
    
    // Test filters
    cy.get('[data-cy=filter-active]').click();
    cy.get('[data-cy=todo-item]').should('have.length', 1);
    cy.get('[data-cy=todo-item]').should('contain', 'Active Todo');
    
    cy.get('[data-cy=filter-completed]').click();
    cy.get('[data-cy=todo-item]').should('have.length', 1);
    cy.get('[data-cy=todo-item]').should('contain', 'Completed Todo');
    
    cy.get('[data-cy=filter-all]').click();
    cy.get('[data-cy=todo-item]').should('have.length', 2);
  });
});
```

## Code Quality Standards

### Backend Code Standards

#### Java Coding Standards
```java
/**
 * Example of well-documented service class following coding standards.
 */
@Service
@Slf4j  // Lombok for logging
public class TodoService {
    
    private static final int MAX_TITLE_LENGTH = 500;
    
    private final TodoStorageService storageService;
    private final TodoMapper todoMapper;
    private final TodoValidator validator;
    
    /**
     * Creates a new todo item.
     * 
     * @param request the todo creation request containing title
     * @return the created todo response
     * @throws ValidationException if the request is invalid
     * @throws ServiceException if creation fails
     */
    @Transactional
    public TodoResponse createTodo(@Valid CreateTodoRequest request) {
        log.debug("Creating todo with title: {}", request.getTitle());
        
        try {
            validator.validateCreateRequest(request);
            
            Todo todo = buildTodoFromRequest(request);
            Todo savedTodo = storageService.save(todo);
            
            log.info("Successfully created todo with id: {}", savedTodo.getId());
            return todoMapper.toResponse(savedTodo);
            
        } catch (Exception e) {
            log.error("Failed to create todo with title: {}", request.getTitle(), e);
            throw new ServiceException("Failed to create todo", e);
        }
    }
    
    private Todo buildTodoFromRequest(CreateTodoRequest request) {
        Todo todo = new Todo();
        todo.setTitle(StringUtils.trim(request.getTitle()));
        todo.setCompleted(false);
        todo.setCreatedAt(LocalDateTime.now());
        todo.setUpdatedAt(LocalDateTime.now());
        return todo;
    }
}
```

#### Exception Handling
```java
/**
 * Global exception handler for consistent error responses.
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidationException(
            ValidationException ex, 
            HttpServletRequest request) {
        
        String correlationId = generateCorrelationId();
        log.warn("Validation error [{}]: {}", correlationId, ex.getMessage());
        
        return ErrorResponse.builder()
            .message("Validation failed")
            .details(ex.getMessage())
            .status(HttpStatus.BAD_REQUEST.value())
            .timestamp(LocalDateTime.now())
            .correlationId(correlationId)
            .path(request.getRequestURI())
            .build();
    }
    
    @ExceptionHandler(TodoNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleTodoNotFound(
            TodoNotFoundException ex, 
            HttpServletRequest request) {
        
        String correlationId = generateCorrelationId();
        log.warn("Todo not found [{}]: {}", correlationId, ex.getMessage());
        
        return ErrorResponse.builder()
            .message("Todo not found")
            .details(ex.getMessage())
            .status(HttpStatus.NOT_FOUND.value())
            .timestamp(LocalDateTime.now())
            .correlationId(correlationId)
            .path(request.getRequestURI())
            .build();
    }
    
    private String generateCorrelationId() {
        return UUID.randomUUID().toString();
    }
}
```

### Frontend Code Standards

#### TypeScript Coding Standards
```typescript
/**
 * Well-structured Angular service following coding standards.
 */
@Injectable({
  providedIn: 'root'
})
export class TodoService implements OnDestroy {
  
  private readonly API_BASE_URL = '/api/todos';
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000;
  
  private readonly todosSubject = new BehaviorSubject<Todo[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly destroy$ = new Subject<void>();
  
  // Public readonly observables
  public readonly todos$ = this.todosSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();
  
  // Computed observables
  public readonly activeTodos$ = this.todos$.pipe(
    map(todos => todos.filter(todo => !todo.completed))
  );
  
  public readonly completedTodos$ = this.todos$.pipe(
    map(todos => todos.filter(todo => todo.completed))
  );
  
  public readonly activeCount$ = this.activeTodos$.pipe(
    map(todos => todos.length)
  );
  
  constructor(
    private readonly http: HttpClient,
    private readonly errorHandler: ErrorHandlerService
  ) {}
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Loads all todos from the server.
   * @returns Observable that completes when todos are loaded
   */
  loadTodos(): Observable<Todo[]> {
    this.setLoading(true);
    this.clearError();
    
    return this.http.get<Todo[]>(this.API_BASE_URL).pipe(
      tap(todos => {
        this.todosSubject.next(todos);
        this.setLoading(false);
      }),
      catchError(error => this.handleError('Failed to load todos', error)),
      retryWhen(errors => this.createRetryStrategy(errors)),
      takeUntil(this.destroy$)
    );
  }
  
  /**
   * Creates a new todo with optimistic updates.
   * @param title The todo title
   * @returns Observable of the created todo
   */
  createTodo(title: string): Observable<Todo> {
    const trimmedTitle = title.trim();
    
    if (!trimmedTitle) {
      return throwError(() => new Error('Title cannot be empty'));
    }
    
    if (trimmedTitle.length > 500) {
      return throwError(() => new Error('Title is too long'));
    }
    
    return this.performOptimisticCreate(trimmedTitle);
  }
  
  private performOptimisticCreate(title: string): Observable<Todo> {
    const optimisticTodo = this.createOptimisticTodo(title);
    const currentTodos = this.todosSubject.value;
    
    // Apply optimistic update
    this.todosSubject.next([...currentTodos, optimisticTodo]);
    
    return this.http.post<Todo>(this.API_BASE_URL, { title }).pipe(
      tap(createdTodo => this.replaceOptimisticTodo(optimisticTodo, createdTodo)),
      catchError(error => {
        this.rollbackOptimisticCreate(optimisticTodo);
        return this.handleError('Failed to create todo', error);
      }),
      takeUntil(this.destroy$)
    );
  }
  
  private createOptimisticTodo(title: string): Todo {
    return {
      id: Date.now(), // Temporary ID
      title,
      completed: false
    };
  }
  
  private replaceOptimisticTodo(optimistic: Todo, real: Todo): void {
    const todos = this.todosSubject.value;
    const index = todos.findIndex(t => t.id === optimistic.id);
    
    if (index !== -1) {
      todos[index] = real;
      this.todosSubject.next([...todos]);
    }
  }
  
  private rollbackOptimisticCreate(optimisticTodo: Todo): void {
    const todos = this.todosSubject.value;
    const filteredTodos = todos.filter(t => t.id !== optimisticTodo.id);
    this.todosSubject.next(filteredTodos);
  }
  
  private createRetryStrategy(errors: Observable<any>): Observable<any> {
    return errors.pipe(
      scan((retryCount, error) => {
        if (retryCount >= this.RETRY_ATTEMPTS) {
          throw error;
        }
        return retryCount + 1;
      }, 0),
      delay(this.RETRY_DELAY)
    );
  }
  
  private handleError(message: string, error: any): Observable<never> {
    this.setError(message);
    this.setLoading(false);
    this.errorHandler.handleError(error);
    return throwError(() => error);
  }
  
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
  
  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }
  
  private clearError(): void {
    this.setError(null);
  }
}
```

## Performance Optimization

### Backend Performance

#### JVM Optimization
```bash
# Production JVM settings
export JAVA_OPTS="-Xmx1g \
  -Xms512m \
  -XX:+UseG1GC \
  -XX:+UseStringDeduplication \
  -XX:+OptimizeStringConcat \
  -XX:+UseCompressedOops \
  -Djava.security.egd=file:/dev/./urandom"
```

#### Application Performance
```java
/**
 * Performance monitoring with Spring Boot Actuator.
 */
@Component
public class PerformanceMetrics {
    
    private final MeterRegistry meterRegistry;
    private final Timer todoCreationTimer;
    private final Counter todoCreationCounter;
    
    public PerformanceMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.todoCreationTimer = Timer.builder("todo.creation.time")
            .description("Time taken to create a todo")
            .register(meterRegistry);
        this.todoCreationCounter = Counter.builder("todo.creation.count")
            .description("Number of todos created")
            .register(meterRegistry);
    }
    
    public <T> T measureTodoCreation(Supplier<T> operation) {
        return todoCreationTimer.recordCallable(() -> {
            T result = operation.get();
            todoCreationCounter.increment();
            return result;
        });
    }
}
```

### Frontend Performance

#### Bundle Optimization
```typescript
// Lazy loading modules
const routes: Routes = [
  {
    path: 'todos',
    loadChildren: () => import('./features/todos/todos.module').then(m => m.TodosModule)
  }
];

// OnPush change detection strategy
@Component({
  selector: 'app-todo-list',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoListComponent {
  // Component implementation
}

// TrackBy functions for ngFor
trackByTodoId(index: number, todo: Todo): number {
  return todo.id;
}
```

#### Memory Management
```typescript
/**
 * Proper subscription management to prevent memory leaks.
 */
@Component({
  // ...
})
export class TodoComponent implements OnInit, OnDestroy {
  
  private readonly destroy$ = new Subject<void>();
  
  ngOnInit(): void {
    this.todoService.todos$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(todos => {
      // Handle todos
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## Contributing Guidelines

### Getting Started

1. **Fork the Repository**: Create a fork of the project
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Implement your feature or fix
4. **Write Tests**: Ensure your changes are tested
5. **Run Tests**: Verify all tests pass
6. **Commit Changes**: Use conventional commit messages
7. **Push to Branch**: `git push origin feature/amazing-feature`
8. **Open Pull Request**: Create a PR with detailed description

### Commit Message Convention

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests
- `chore`: Changes to build process or auxiliary tools

**Examples**:
```
feat(todos): add toggle all functionality

Implement toggle all feature that allows users to mark all todos as
complete or incomplete with a single action.

- Add toggle-all endpoint to backend API
- Implement ToggleAllComponent in frontend
- Add comprehensive tests for toggle functionality
- Update documentation

Closes #123
```

### Code Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and checks
2. **Peer Review**: At least one team member reviews the code
3. **Documentation**: Ensure documentation is updated
4. **Testing**: Verify test coverage meets requirements
5. **Performance**: Check for performance implications
6. **Security**: Review for security considerations

### Development Workflow

```bash
# Setup development environment
git clone <repository-url>
cd todo-mvc
./scripts/setup-dev.sh

# Start development servers
./scripts/start-dev.sh

# Run tests
./scripts/test-all.sh

# Build for production
./scripts/build-production.sh

# Deploy to staging
./scripts/deploy-staging.sh
```

## Troubleshooting

### Common Development Issues

#### Backend Issues

**Port Already in Use**:
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use different port
mvn spring-boot:run -Dserver.port=8081
```

**Maven Build Failures**:
```bash
# Clean Maven cache
mvn clean
rm -rf ~/.m2/repository

# Rebuild
mvn clean install -U
```

**Test Failures**:
```bash
# Run specific test
mvn test -Dtest=TodoServiceTest

# Run tests with debugging
mvn test -Dmaven.surefire.debug

# Skip tests temporarily
mvn clean install -DskipTests
```

#### Frontend Issues

**Node Modules Issues**:
```bash
# Clear npm cache
npm cache clean --force

# Remove and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Angular CLI Issues**:
```bash
# Update Angular CLI
npm uninstall -g @angular/cli
npm install -g @angular/cli@latest

# Clear Angular cache
ng cache clean
```

**Proxy Issues**:
```bash
# Check proxy configuration
cat proxy.conf.json

# Test backend directly
curl http://localhost:8080/api/todos

# Restart with proxy
ng serve --proxy-config proxy.conf.json
```

### Performance Issues

**High Memory Usage**:
```bash
# Monitor memory usage
top -p $(pgrep java)

# Java heap dump
jcmd <PID> GC.run_finalization
jcmd <PID> VM.gc

# Analyze with VisualVM or JProfiler
```

**Slow Response Times**:
```bash
# Enable Spring Boot Actuator metrics
curl http://localhost:8080/actuator/metrics/http.server.requests

# Profile with async-profiler
java -jar async-profiler.jar -d 30 -f profile.html <PID>
```

## Resources and References

### Documentation
- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Angular Documentation](https://angular.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [RxJS Documentation](https://rxjs.dev/)

### Tools and Libraries
- [Maven Central](https://search.maven.org/)
- [npm Registry](https://www.npmjs.com/)
- [Spring Initializr](https://start.spring.io/)
- [Angular CLI](https://cli.angular.io/)

### Best Practices
- [Java Code Conventions](https://www.oracle.com/java/technologies/javase/codeconventions-contents.html)
- [Angular Style Guide](https://angular.io/guide/styleguide)
- [REST API Design](https://restfulapi.net/)
- [Testing Best Practices](https://martinfowler.com/articles/practical-test-pyramid.html)

### Community
- [Stack Overflow](https://stackoverflow.com/questions/tagged/spring-boot+angular)
- [Spring Community](https://spring.io/community)
- [Angular Community](https://community.angular.io/)
- [GitHub Discussions](https://github.com/features/discussions)

---

**Developer Guide Version**: 1.0  
**Last Updated**: August 17, 2025  
**Target Audience**: Software Developers, DevOps Engineers  
**Prerequisites**: Java 17+, Node.js 18+, Modern IDE