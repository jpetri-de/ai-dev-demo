# Backend Implementation Plan: Todo Model & REST API

## Context

Based on specification `02-todo-model.md`, this plan outlines the implementation of a complete Todo model with REST API endpoints using in-memory storage. The backend structure already exists with Spring Boot 3.2, Java 17, and Maven configuration.

**Business Requirements:**
- Create, read, update, delete todos
- Toggle todo completion status
- Clear completed todos
- In-memory persistence (no database)
- Thread-safe operations
- Input validation and error handling

## API Design

### REST Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/todos` | Retrieve all todos | - | `200 OK` with Todo array |
| POST | `/api/todos` | Create new todo | `CreateTodoRequest` | `201 Created` with Todo |
| PUT | `/api/todos/{id}` | Update existing todo | `UpdateTodoRequest` | `200 OK` with Todo |
| DELETE | `/api/todos/{id}` | Delete todo by ID | - | `204 No Content` |
| PUT | `/api/todos/{id}/toggle` | Toggle completion status | - | `200 OK` with Todo |
| DELETE | `/api/todos/completed` | Delete all completed todos | - | `204 No Content` |

### DTOs and Request/Response Objects

```java
// Request DTOs
public record CreateTodoRequest(
    @NotBlank(message = "Title cannot be blank")
    @Size(max = 500, message = "Title cannot exceed 500 characters")
    String title
) {}

public record UpdateTodoRequest(
    @NotBlank(message = "Title cannot be blank")
    @Size(max = 500, message = "Title cannot exceed 500 characters")
    String title,
    Boolean completed
) {}

// Response DTOs
public record TodoResponse(
    Long id,
    String title,
    boolean completed
) {}

public record ErrorResponse(
    String message,
    String details,
    int status,
    String timestamp
) {}
```

### OpenAPI Documentation

```yaml
openapi: 3.0.3
info:
  title: TodoMVC Backend API
  version: 1.0.0
  description: REST API for TodoMVC application

paths:
  /api/todos:
    get:
      summary: Get all todos
      responses:
        '200':
          description: List of todos
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TodoResponse'
    post:
      summary: Create new todo
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTodoRequest'
      responses:
        '201':
          description: Todo created
        '400':
          description: Invalid input
```

## Data Model

### Entity Model

```java
public class Todo {
    private Long id;
    private String title;
    private boolean completed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors, getters, setters
    // equals/hashCode based on id
    // toString method
}
```

### Domain Rules
- **ID Generation**: Auto-increment starting from 1
- **Title Validation**: Not null/blank after trim, max 500 characters
- **Default State**: New todos are not completed
- **Timestamps**: Track creation and update times
- **Uniqueness**: ID-based equality

## Architecture

### Layer Structure

```
Controller Layer (REST endpoints)
    ↓
Service Layer (business logic)
    ↓
Storage Layer (in-memory repository)
    ↓
Model Layer (Todo entity)
```

### Dependency Flow

```java
@RestController
public class TodoController {
    private final TodoService todoService; // Dependency injection
}

@Service  
public class TodoService {
    private final TodoStorageService storageService; // Business logic
}

@Service
public class TodoStorageService {
    private final List<Todo> todos; // Thread-safe storage
    private final AtomicLong idCounter; // ID generation
}
```

### Design Patterns
- **Repository Pattern**: `TodoStorageService` acts as in-memory repository
- **Service Layer Pattern**: Business logic separated from controllers
- **DTO Pattern**: Request/response objects separate from entities
- **Factory Pattern**: Todo creation with proper defaults

## Security

### CORS Configuration
```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

### Input Validation
- **Bean Validation**: `@Valid`, `@NotBlank`, `@Size` annotations
- **Custom Validation**: Title trimming and sanitization
- **Error Messages**: Internationalized validation messages

### Data Protection
- **XSS Prevention**: HTML escaping for title values
- **Input Sanitization**: Trim whitespace, validate length
- **Thread Safety**: Synchronized collections for concurrent access

## Implementation

### File Structure
```
src/main/java/com/example/todobackend/
├── TodoBackendApplication.java (existing)
├── controller/
│   └── TodoController.java
├── service/
│   ├── TodoService.java
│   └── TodoStorageService.java
├── model/
│   └── Todo.java
├── dto/
│   ├── CreateTodoRequest.java
│   ├── UpdateTodoRequest.java
│   ├── TodoResponse.java
│   └── ErrorResponse.java
├── exception/
│   ├── TodoNotFoundException.java
│   └── GlobalExceptionHandler.java
├── config/
│   └── CorsConfig.java (modify existing)
└── mapper/
    └── TodoMapper.java
```

### Core Components Implementation

#### 1. Todo Entity (`/src/main/java/com/example/todobackend/model/Todo.java`)
```java
public class Todo {
    private Long id;
    private String title;
    private boolean completed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public Todo() {
        this.completed = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Todo(String title) {
        this();
        this.title = title != null ? title.trim() : null;
    }
    
    // Update method to refresh updatedAt timestamp
    public void updateTitle(String title) {
        this.title = title != null ? title.trim() : null;
        this.updatedAt = LocalDateTime.now();
    }
    
    public void toggleCompleted() {
        this.completed = !this.completed;
        this.updatedAt = LocalDateTime.now();
    }
}
```

#### 2. Storage Service (`/src/main/java/com/example/todobackend/service/TodoStorageService.java`)
```java
@Service
public class TodoStorageService {
    private final List<Todo> todos = Collections.synchronizedList(new ArrayList<>());
    private final AtomicLong idCounter = new AtomicLong(1);
    
    public List<Todo> findAll() {
        return new ArrayList<>(todos); // Return copy for thread safety
    }
    
    public Optional<Todo> findById(Long id) {
        return todos.stream()
                .filter(todo -> Objects.equals(todo.getId(), id))
                .findFirst();
    }
    
    public Todo save(Todo todo) {
        if (todo.getId() == null) {
            todo.setId(idCounter.getAndIncrement());
            todos.add(todo);
        } else {
            // Update existing
            for (int i = 0; i < todos.size(); i++) {
                if (Objects.equals(todos.get(i).getId(), todo.getId())) {
                    todos.set(i, todo);
                    break;
                }
            }
        }
        return todo;
    }
    
    public boolean deleteById(Long id) {
        return todos.removeIf(todo -> Objects.equals(todo.getId(), id));
    }
    
    public void deleteCompleted() {
        todos.removeIf(Todo::isCompleted);
    }
}
```

#### 3. Business Service (`/src/main/java/com/example/todobackend/service/TodoService.java`)
```java
@Service
@Transactional
public class TodoService {
    private final TodoStorageService storageService;
    private final TodoMapper mapper;
    
    public List<TodoResponse> getAllTodos() {
        return storageService.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }
    
    public TodoResponse createTodo(CreateTodoRequest request) {
        String trimmedTitle = request.title().trim();
        if (trimmedTitle.isEmpty()) {
            throw new IllegalArgumentException("Title cannot be empty");
        }
        
        Todo todo = new Todo(trimmedTitle);
        Todo savedTodo = storageService.save(todo);
        return mapper.toResponse(savedTodo);
    }
    
    public TodoResponse updateTodo(Long id, UpdateTodoRequest request) {
        Todo todo = storageService.findById(id)
                .orElseThrow(() -> new TodoNotFoundException("Todo not found with id: " + id));
                
        todo.updateTitle(request.title());
        if (request.completed() != null) {
            todo.setCompleted(request.completed());
        }
        
        Todo updatedTodo = storageService.save(todo);
        return mapper.toResponse(updatedTodo);
    }
    
    public TodoResponse toggleTodo(Long id) {
        Todo todo = storageService.findById(id)
                .orElseThrow(() -> new TodoNotFoundException("Todo not found with id: " + id));
                
        todo.toggleCompleted();
        Todo updatedTodo = storageService.save(todo);
        return mapper.toResponse(updatedTodo);
    }
    
    public void deleteTodo(Long id) {
        if (!storageService.deleteById(id)) {
            throw new TodoNotFoundException("Todo not found with id: " + id);
        }
    }
    
    public void deleteCompletedTodos() {
        storageService.deleteCompleted();
    }
}
```

#### 4. REST Controller (`/src/main/java/com/example/todobackend/controller/TodoController.java`)
```java
@RestController
@RequestMapping("/api/todos")
@Validated
public class TodoController {
    private final TodoService todoService;
    
    @GetMapping
    public ResponseEntity<List<TodoResponse>> getAllTodos() {
        List<TodoResponse> todos = todoService.getAllTodos();
        return ResponseEntity.ok(todos);
    }
    
    @PostMapping
    public ResponseEntity<TodoResponse> createTodo(@Valid @RequestBody CreateTodoRequest request) {
        TodoResponse todo = todoService.createTodo(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(todo);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TodoResponse> updateTodo(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTodoRequest request) {
        TodoResponse todo = todoService.updateTodo(id, request);
        return ResponseEntity.ok(todo);
    }
    
    @PutMapping("/{id}/toggle")
    public ResponseEntity<TodoResponse> toggleTodo(@PathVariable Long id) {
        TodoResponse todo = todoService.toggleTodo(id);
        return ResponseEntity.ok(todo);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Long id) {
        todoService.deleteTodo(id);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/completed")
    public ResponseEntity<Void> deleteCompletedTodos() {
        todoService.deleteCompletedTodos();
        return ResponseEntity.noContent().build();
    }
}
```

#### 5. Exception Handling (`/src/main/java/com/example/todobackend/exception/GlobalExceptionHandler.java`)
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(TodoNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleTodoNotFound(TodoNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
                ex.getMessage(),
                "The requested todo does not exist",
                HttpStatus.NOT_FOUND.value(),
                LocalDateTime.now().toString()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
                
        ErrorResponse error = new ErrorResponse(
                "Validation failed",
                details,
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now().toString()
        );
        return ResponseEntity.badRequest().body(error);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        ErrorResponse error = new ErrorResponse(
                ex.getMessage(),
                "Invalid request parameters",
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now().toString()
        );
        return ResponseEntity.badRequest().body(error);
    }
}
```

### Dependencies Required

Add to `pom.xml`:
```xml
<!-- Bean Validation -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- MapStruct for DTO mapping -->
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.5.5.Final</version>
</dependency>
<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct-processor</artifactId>
    <version>1.5.5.Final</version>
    <scope>provided</scope>
</dependency>
```

## Testing Strategy

### Unit Tests
- **Service Layer**: Mock dependencies, test business logic
- **Storage Layer**: Test thread safety, CRUD operations
- **Validation**: Test Bean Validation constraints
- **Exception Handling**: Test error scenarios

### Integration Tests
- **Controller Layer**: `@WebMvcTest` for REST endpoints
- **Full Integration**: `@SpringBootTest` for complete flows
- **Concurrent Testing**: Multiple threads accessing storage

### Test Data Strategy
```java
@TestConfiguration
public class TestDataConfiguration {
    @Bean
    @Primary
    public TodoStorageService testTodoStorageService() {
        TodoStorageService service = new TodoStorageService();
        // Pre-populate with test data
        service.save(new Todo("Test Todo 1"));
        service.save(new Todo("Test Todo 2"));
        return service;
    }
}
```

### Test Coverage Goals
- **Minimum**: 85% line coverage
- **Target**: 95% line coverage
- **Critical Paths**: 100% coverage for business logic
- **Edge Cases**: All validation and error scenarios

### Example Test Cases
```java
@WebMvcTest(TodoController.class)
class TodoControllerTest {
    
    @Test
    void createTodo_ValidInput_Returns201() throws Exception {
        // Given
        CreateTodoRequest request = new CreateTodoRequest("New Todo");
        
        // When & Then
        mockMvc.perform(post("/api/todos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("New Todo"))
                .andExpect(jsonPath("$.completed").value(false));
    }
    
    @Test
    void createTodo_EmptyTitle_Returns400() throws Exception {
        // Given
        CreateTodoRequest request = new CreateTodoRequest("");
        
        // When & Then
        mockMvc.perform(post("/api/todos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
```

## Deployment

### Configuration Profiles

#### Development (`application-dev.properties`)
```properties
# Development specific settings
logging.level.com.example.todobackend=DEBUG
cors.allowed-origins=http://localhost:4200,http://localhost:3000
```

#### Test (`application-test.properties`)
```properties
# Test specific settings
logging.level.com.example.todobackend=WARN
cors.allowed-origins=*
```

#### Production (`application-prod.properties`)
```properties
# Production settings
logging.level.com.example.todobackend=WARN
cors.allowed-origins=${ALLOWED_ORIGINS:http://localhost:4200}
```

### Health Checks
```java
@Component
public class TodoHealthIndicator implements HealthIndicator {
    private final TodoStorageService storageService;
    
    @Override
    public Health health() {
        try {
            int todoCount = storageService.findAll().size();
            return Health.up()
                    .withDetail("todoCount", todoCount)
                    .withDetail("status", "In-memory storage operational")
                    .build();
        } catch (Exception e) {
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
```

### Monitoring
- **Actuator Endpoints**: `/actuator/health`, `/actuator/info`
- **Metrics**: Custom metrics for todo operations
- **Logging**: Structured logging with correlation IDs

## Risks

### Performance Bottlenecks
- **Concurrent Access**: Synchronized list may become bottleneck with high concurrency
- **Memory Usage**: In-memory storage grows indefinitely without cleanup
- **Search Performance**: Linear search through todo list (O(n) complexity)

**Mitigation Strategies:**
- Use `ConcurrentHashMap` for O(1) lookups by ID
- Implement memory limits and LRU eviction
- Add pagination for large todo lists

### Security Concerns
- **CORS Configuration**: Overly permissive origins in development
- **Input Validation**: XSS attacks through todo titles
- **Memory Leaks**: Unbounded growth of todo storage

**Mitigation Strategies:**
- Strict CORS configuration for production
- HTML encoding for all user inputs
- Memory monitoring and cleanup policies

### Scalability Issues
- **Single Instance**: In-memory storage doesn't scale horizontally
- **State Loss**: Application restart loses all todos
- **Concurrent Modifications**: Race conditions in high-load scenarios

**Future Considerations:**
- Migrate to persistent storage (database)
- Implement distributed caching (Redis)
- Add event sourcing for audit trails
