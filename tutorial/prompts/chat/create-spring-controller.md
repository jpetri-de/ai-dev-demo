# Chat-Prompt: Spring Boot REST Controller

## Prompt-Template

```
Erstelle einen Spring Boot @RestController für {ENTITY_NAME}-CRUD-Operationen. 

Implementiere diese Endpoints:
- GET /api/{entity_path} - Alle {entity_name} abrufen
- GET /api/{entity_path}/{id} - Einzelnes {entity_name} abrufen
- POST /api/{entity_path} - Neues {entity_name} erstellen  
- PUT /api/{entity_path}/{id} - {entity_name} aktualisieren
- DELETE /api/{entity_path}/{id} - {entity_name} löschen

Verwende diese {entity_name}-Entität als Referenz:
```java
{ENTITY_CODE_HERE}
```

Requirements:
- Constructor Injection für Service und Mapper
- Proper HTTP Status Codes (200, 201, 204, 404, 400, 500)
- Exception Handling mit try-catch
- Validation mit @Valid
- Structured Logging mit @Slf4j
- ResponseEntity für alle Responses
- Location Header für Created Resources
- Comprehensive Javadoc Documentation

Implementiere auch die notwendigen DTOs (Create{Entity}Request, {Entity}Response) 
und verwende moderne Spring Boot 3.2 Best Practices.
```

## Verwendungsbeispiel

### Input (TodoMVC-Projekt)
```
Erstelle einen Spring Boot @RestController für Todo-CRUD-Operationen. 

Implementiere diese Endpoints:
- GET /api/todos - Alle Todos abrufen
- GET /api/todos/{id} - Einzelnes Todo abrufen
- POST /api/todos - Neues Todo erstellen  
- PUT /api/todos/{id} - Todo aktualisieren
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

Requirements:
- Constructor Injection für TodoService und TodoMapper
- Proper HTTP Status Codes (200, 201, 204, 404, 400, 500)
- Exception Handling mit try-catch
- Validation mit @Valid
- Structured Logging mit @Slf4j
- ResponseEntity für alle Responses
- Location Header für Created Resources
- Comprehensive Javadoc Documentation

Implementiere auch die notwendigen DTOs (CreateTodoRequest, TodoResponse) 
und verwende moderne Spring Boot 3.2 Best Practices.
```

## Template-Variablen

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `{ENTITY_NAME}` | Klassen-Name der Entity | `Todo` |
| `{entity_name}` | Lowercase Entity-Name | `todo` |
| `{entity_path}` | REST-Pfad (meist plural) | `todos` |
| `{ENTITY_CODE_HERE}` | Vollständiger Entity-Code | `@Entity public class Todo {...}` |

## Erwarteter Output

### TodoController.java
```java
@RestController
@RequestMapping("/api/todos")
@Validated
@Slf4j
@RequiredArgsConstructor
public class TodoController {
    
    private final TodoService todoService;
    private final TodoMapper todoMapper;
    
    /**
     * Retrieves all todos from the system.
     * 
     * @return List of all todos wrapped in ResponseEntity with 200 status
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
    
    // ... weitere Methoden
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

## Anpassungen für andere Entities

### User Entity Beispiel
```
Erstelle einen Spring Boot @RestController für User-CRUD-Operationen. 

Implementiere diese Endpoints:
- GET /api/users - Alle Users abrufen
- GET /api/users/{id} - Einzelnen User abrufen
- POST /api/users - Neuen User erstellen  
- PUT /api/users/{id} - User aktualisieren
- DELETE /api/users/{id} - User löschen

Verwende diese User-Entität als Referenz:
```java
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    @Size(min = 2, max = 50)
    private String firstName;
    
    @NotBlank  
    @Size(min = 2, max = 50)
    private String lastName;
    
    // getters/setters...
}
```
```

## Best Practices

### ✅ Gute Prompts
- Vollständige Entity-Definition bereitstellen
- Spezifische Requirements auflisten
- Framework-Version angeben (Spring Boot 3.2)
- Logging und Documentation explizit fordern

### ❌ Schlechte Prompts
- "Erstelle einen Controller" (zu vage)
- Keine Entity-Referenz
- Fehlende Requirements
- Veraltete Framework-Versionen

## Variationen

### Minimal-Version
```
Erstelle einen Spring Boot REST Controller für {entity} mit CRUD-Endpoints.
Entity: [ENTITY_CODE]
```

### Enterprise-Version
```
Erstelle einen production-ready Spring Boot 3.2 REST Controller mit:
- OpenAPI 3.0 Documentation
- Rate Limiting Support  
- Audit Logging
- Security Annotations
- Comprehensive Exception Handling
- Circuit Breaker Pattern
Entity: [ENTITY_CODE]
```

### Testing-Fokus Version
```
Erstelle Controller mit fokus auf Testability:
- MockMvc-friendly Design
- Dependency Injection optimiert für Mocking
- Clear separation of concerns
- Validation layers für Unit Testing
Entity: [ENTITY_CODE]
```