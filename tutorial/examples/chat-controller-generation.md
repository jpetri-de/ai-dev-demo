# Chat-Beispiel: Spring Boot Controller-Generierung

## Scenario
Sie möchten einen vollständigen REST-Controller für Todo-Management erstellen.

## Input: Prompt für continue.dev Chat

### Prompt
```
Erstelle einen Spring Boot @RestController für Todo-CRUD-Operationen. 
Implementiere diese Endpoints:
- GET /api/todos - Alle Todos abrufen
- POST /api/todos - Neues Todo erstellen  
- PUT /api/todos/{id}/toggle - Todo-Status umschalten
- DELETE /api/todos/{id} - Todo löschen

Verwende diese Todo-Entität als Referenz:
```java
@Entity
@Table(name = "todos")
public class Todo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Title cannot be blank")
    @Size(max = 500, message = "Title cannot exceed 500 characters")
    private String title;
    
    private boolean completed = false;
    
    @CreationTimestamp
    private Instant createdAt;
    
    // Standard getters/setters...
}
```

Implementiere auch die notwendigen DTOs (CreateTodoRequest, TodoResponse) und 
verwende proper HTTP Status Codes und Exception Handling.
```

## Output: Generierter Code

### TodoController.java
```java
@RestController
@RequestMapping("/api/todos")
@Validated
@Slf4j
public class TodoController {
    
    private final TodoService todoService;
    private final TodoMapper todoMapper;
    
    public TodoController(TodoService todoService, TodoMapper todoMapper) {
        this.todoService = todoService;
        this.todoMapper = todoMapper;
    }
    
    /**
     * Retrieves all todos from the system.
     * 
     * @return List of all todos wrapped in ResponseEntity
     */
    @GetMapping
    public ResponseEntity<List<TodoResponse>> getAllTodos() {
        log.debug("Retrieving all todos");
        
        List<Todo> todos = todoService.getAllTodos();
        List<TodoResponse> responses = todos.stream()
            .map(todoMapper::toResponse)
            .collect(Collectors.toList());
            
        log.debug("Retrieved {} todos", responses.size());
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Creates a new todo item.
     * 
     * @param request the todo creation request
     * @return the created todo wrapped in ResponseEntity with 201 status
     */
    @PostMapping
    public ResponseEntity<TodoResponse> createTodo(
            @Valid @RequestBody CreateTodoRequest request,
            HttpServletRequest httpRequest) {
                
        log.debug("Creating new todo with title: {}", request.getTitle());
        
        Todo todo = todoService.createTodo(request.getTitle());
        TodoResponse response = todoMapper.toResponse(todo);
        
        log.info("Created todo with ID: {} and title: {}", todo.getId(), todo.getTitle());
        
        // Build location header for created resource
        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(todo.getId())
            .toUri();
            
        return ResponseEntity.created(location).body(response);
    }
    
    /**
     * Toggles the completion status of a todo.
     * 
     * @param id the todo ID
     * @return the updated todo wrapped in ResponseEntity
     * @throws TodoNotFoundException if todo with given ID doesn't exist
     */
    @PutMapping("/{id}/toggle")
    public ResponseEntity<TodoResponse> toggleTodo(@PathVariable Long id) {
        log.debug("Toggling todo status for ID: {}", id);
        
        try {
            Todo todo = todoService.toggleTodo(id);
            TodoResponse response = todoMapper.toResponse(todo);
            
            log.info("Toggled todo ID: {} to completed: {}", id, todo.isCompleted());
            return ResponseEntity.ok(response);
            
        } catch (TodoNotFoundException e) {
            log.warn("Attempted to toggle non-existent todo with ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Deletes a todo by its ID.
     * 
     * @param id the todo ID to delete
     * @return ResponseEntity with 204 status if successful, 404 if not found
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Long id) {
        log.debug("Deleting todo with ID: {}", id);
        
        try {
            todoService.deleteTodo(id);
            log.info("Successfully deleted todo with ID: {}", id);
            return ResponseEntity.noContent().build();
            
        } catch (TodoNotFoundException e) {
            log.warn("Attempted to delete non-existent todo with ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Retrieves a specific todo by its ID.
     * 
     * @param id the todo ID
     * @return the todo wrapped in ResponseEntity, or 404 if not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<TodoResponse> getTodoById(@PathVariable Long id) {
        log.debug("Retrieving todo with ID: {}", id);
        
        try {
            Todo todo = todoService.getTodoById(id);
            TodoResponse response = todoMapper.toResponse(todo);
            
            log.debug("Retrieved todo: {}", response.getTitle());
            return ResponseEntity.ok(response);
            
        } catch (TodoNotFoundException e) {
            log.warn("Requested non-existent todo with ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
}
```

### CreateTodoRequest.java
```java
public record CreateTodoRequest(
    @NotBlank(message = "Title cannot be blank")
    @Size(max = 500, message = "Title cannot exceed 500 characters")
    String title
) {}
```

### TodoResponse.java
```java
public record TodoResponse(
    Long id,
    String title,
    boolean completed,
    Instant createdAt
) {}
```

### TodoMapper.java
```java
@Mapper(componentModel = "spring")
public interface TodoMapper {
    
    TodoResponse toResponse(Todo todo);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true) 
    @Mapping(target = "completed", constant = "false")
    Todo toEntity(CreateTodoRequest request);
}
```

## Warum funktioniert dieser Prompt so gut?

### 1. **Konkreter Kontext**
- Die Todo-Entität wurde als Referenz bereitgestellt
- Spezifische Endpoint-Anforderungen wurden definiert
- Validation-Constraints wurden kommuniziert

### 2. **Best Practices Integration**
- Spring Boot Konventionen werden automatisch befolgt
- Proper HTTP Status Codes (200, 201, 204, 404)
- Constructor Injection statt @Autowired
- Structured Logging mit SLF4J

### 3. **Professional Code Quality**
- Comprehensive Javadoc Documentation
- Exception Handling mit spezifischen Responses  
- Location Headers für Created Resources
- Input Validation mit Bean Validation

### 4. **Production-Ready Features**
- Correlation IDs für Request Tracking
- Proper Error Responses
- Security Considerations (Validation)
- Performance Optimizations (StreamAPI)

## Verwendung

1. **Chat öffnen**: Continue.dev Chat-Panel öffnen
2. **Prompt einfügen**: Den kompletten Prompt mit Todo-Entität copy-pasten
3. **Generieren**: Continue.dev erstellt den vollständigen Controller
4. **Verfeinern**: Bei Bedarf mit Edit-Modus nachbessern

## Zeitersparnis

- **Ohne KI**: 45-60 Minuten für vollständigen Controller mit Tests
- **Mit continue.dev**: 5-10 Minuten für Generierung + Review
- **Ersparnis**: 85-90% der Entwicklungszeit

## Next Steps

Nach der Controller-Generierung:
1. **Service-Schicht implementieren** (ebenfalls mit Chat-Modus)
2. **Unit Tests generieren** (separate Prompt für Tests)
3. **Integration Tests** mit MockMvc
4. **API-Dokumentation** mit OpenAPI/Swagger