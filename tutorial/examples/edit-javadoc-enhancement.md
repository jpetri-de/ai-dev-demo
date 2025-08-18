# Edit-Beispiel: Javadoc-Dokumentation verbessern

## Scenario
Sie haben einen Spring Boot Controller-Endpunkt generiert, der professionelle Dokumentation benötigt.

## Ausgangscode
```java
@PostMapping
public ResponseEntity<TodoResponse> createTodo(@Valid @RequestBody CreateTodoRequest request) {
    Todo todo = todoService.createTodo(request.getTitle());
    TodoResponse response = todoMapper.toResponse(todo);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

## Edit-Modus Aktion

### 1. Code markieren
Selektieren Sie die gesamte `createTodo`-Methode im Editor

### 2. Edit-Modus aktivieren
- **VS Code**: `Ctrl+I` (Windows/Linux) oder `Cmd+I` (Mac)
- **IntelliJ**: `Ctrl+Shift+Enter`

### 3. Prompt eingeben
```
Füge umfassende Javadoc-Dokumentation für diese Methode hinzu.
Erkläre den Zweck, Parameter, Return-Werte und mögliche HTTP-Status-Codes.
Verwende @param, @return, @throws und @apiNote Tags.
```

## Ergebnis: Dokumentierter Code

```java
/**
 * Creates a new Todo item in the system.
 * 
 * This endpoint accepts a CreateTodoRequest containing the title of the new todo.
 * The todo is created with completed status set to false by default and receives
 * an auto-generated unique identifier.
 * 
 * @param request the request object containing the todo title and validation constraints
 * @return ResponseEntity containing the created TodoResponse with HTTP 201 status
 * @throws ValidationException if the request fails validation (title is blank or exceeds 500 characters)
 * @throws DataIntegrityViolationException if database constraints are violated
 * 
 * @apiNote This endpoint follows REST conventions:
 *          - HTTP 201 (Created) for successful creation
 *          - HTTP 400 (Bad Request) for validation errors  
 *          - HTTP 500 (Internal Server Error) for system errors
 *          - Location header contains URI of created resource
 * 
 * @since 1.0
 * @see TodoResponse
 * @see CreateTodoRequest
 * @see TodoService#createTodo(String)
 */
@PostMapping
public ResponseEntity<TodoResponse> createTodo(@Valid @RequestBody CreateTodoRequest request) {
    Todo todo = todoService.createTodo(request.getTitle());
    TodoResponse response = todoMapper.toResponse(todo);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

## Warum Edit-Modus ideal ist

### 1. **Chirurgische Präzision**
- Nur die markierte Methode wird verändert
- Keine ungewollten Änderungen am umgebenden Code
- Bestehende Implementierung bleibt unberührt

### 2. **Kontextbewusst**
- Versteht die Parameter und Return-Types
- Berücksichtigt verwendete Frameworks (Spring Boot, Bean Validation)
- Erkennt REST-Konventionen automatisch

### 3. **Konsistenz**
- Behält bestehenden Code-Stil bei
- Verwendet projektspezifische Naming-Conventions
- Folgt Team-Standards für Dokumentation

### 4. **Effizienz**
- **Zeit**: 30 Sekunden vs. 5 Minuten manuell
- **Qualität**: Strukturierte, vollständige Dokumentation
- **Standards**: Automatische Einhaltung von Javadoc-Best-Practices

## Weitere Edit-Anwendungsfälle

### Exception-Dokumentation hinzufügen
```java
// Markiere Exception-Handler Methode
@ExceptionHandler(TodoNotFoundException.class)
public ResponseEntity<ErrorResponse> handleTodoNotFound(TodoNotFoundException ex) {
    // ...
}
```

**Edit-Prompt:**
```
Füge Javadoc hinzu, die erklärt welche Exception behandelt wird,
wann sie auftritt und welche HTTP-Response zurückgegeben wird.
```

### Validierungs-Constraints dokumentieren
```java
// Markiere DTO-Klasse
public record CreateTodoRequest(
    @NotBlank(message = "Title cannot be blank")
    @Size(max = 500, message = "Title cannot exceed 500 characters")
    String title
) {}
```

**Edit-Prompt:**
```
Füge Javadoc für dieses Record hinzu. Erkläre die Validation-Constraints
und deren Auswirkungen auf die API-Nutzung.
```

## Best Practices für Edit-Prompts

### ✅ Spezifisch und fokussiert
```
Füge @param und @return Javadoc Tags für diese Methode hinzu
```

### ✅ Framework-bewusst  
```
Dokumentiere diese Spring Boot Controller-Methode mit REST-spezifischen Details
```

### ✅ Team-Standards einbeziehen
```
Verwende unsere Standard-Javadoc-Vorlage mit @since, @apiNote und Cross-References
```

### ❌ Zu vage
```
Mach die Dokumentation besser
```

### ❌ Zu weitreichend
```
Dokumentiere die gesamte Klasse und refactore den Code
```

## Integration in den Workflow

1. **Code Review Vorbereitung**: Edit-Modus für letzte Dokumentations-Verbesserungen
2. **Legacy Code Enhancement**: Schrittweise Dokumentation bestehender Methoden  
3. **API-Dokumentation**: Vorbereitung für OpenAPI/Swagger-Generierung
4. **Onboarding Support**: Bessere Verständlichkeit für neue Team-Mitglieder

## Zeitersparnis-Analyse

| Dokumentations-Task | Manuell | Mit Edit-Modus | Ersparnis |
|---------------------|---------|----------------|-----------|
| **Einzelne Methode** | 5 Min | 30 Sek | 90% |
| **DTO-Klasse** | 8 Min | 1 Min | 87% |
| **Exception-Handler** | 3 Min | 20 Sek | 89% |
| **Service-Interface** | 15 Min | 2 Min | 87% |

**Gesamtersparnis**: ~88% bei deutlich höherer Konsistenz und Vollständigkeit.