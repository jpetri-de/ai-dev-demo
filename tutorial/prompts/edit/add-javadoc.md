# Edit-Prompt: Javadoc Documentation

## Prompt-Template

```
Füge umfassende Javadoc-Dokumentation für diese {METHOD_TYPE} hinzu.

Dokumentiere:
- Zweck und Funktionalität
- @param für alle Parameter mit Beschreibung
- @return für Return-Werte mit möglichen Status
- @throws für alle möglichen Exceptions
- @apiNote für REST-spezifische Details (bei Controller-Methoden)
- @since Version
- @see Cross-References zu verwandten Klassen

Verwende professionellen, klaren Stil und folge JavaDoc-Best-Practices.
```

## Anwendungsfälle

### 1. **Controller-Methoden**

**Markierter Code:**
```java
@PostMapping
public ResponseEntity<TodoResponse> createTodo(@Valid @RequestBody CreateTodoRequest request) {
    Todo todo = todoService.createTodo(request.getTitle());
    TodoResponse response = todoMapper.toResponse(todo);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

**Edit-Prompt:**
```
Füge umfassende Javadoc-Dokumentation für diese Controller-Methode hinzu.

Dokumentiere:
- Zweck und Funktionalität
- @param für alle Parameter mit Beschreibung
- @return für Return-Werte mit möglichen Status
- @throws für alle möglichen Exceptions
- @apiNote für REST-spezifische Details (HTTP Status Codes)
- @since Version
- @see Cross-References zu verwandten Klassen

Verwende professionellen, klaren Stil und folge JavaDoc-Best-Practices.
```

**Erwartetes Ergebnis:**
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
    // Implementation...
}
```

### 2. **Service-Methoden**

**Edit-Prompt:**
```
Füge umfassende Javadoc-Dokumentation für diese Service-Methode hinzu.

Dokumentiere:
- Business Logic und Zweck
- @param für alle Parameter
- @return für Return-Werte  
- @throws für Business Exceptions
- Algoritmus-Details wenn relevant
- @since Version

Fokussiere auf Business-Logik, nicht auf technische Implementation.
```

### 3. **Entity-Klassen**

**Edit-Prompt:**
```
Füge umfassende Javadoc-Dokumentation für diese Entity-Klasse hinzu.

Dokumentiere:
- Zweck der Entity im Domain-Model
- Wichtige Business Rules
- Beziehungen zu anderen Entities
- Validation-Constraints und deren Bedeutung
- @since Version
- @author falls gewünscht

Erkläre die fachliche Bedeutung, nicht nur technische Details.
```

### 4. **DTO/Record-Klassen**

**Edit-Prompt:**
```
Füge Javadoc-Dokumentation für dieses DTO/Record hinzu.

Dokumentiere:
- Verwendungszweck (Request/Response)
- Validation-Rules und deren fachliche Bedeutung
- API-Kontext (welche Endpoints verwenden es)
- @param für Record-Parameter
- @since Version

Fokussiere auf API-Dokumentation und fachliche Bedeutung der Felder.
```

## Spezielle Variationen

### **Minimal-Dokumentation**
```
Füge kurze, prägnante Javadoc für diese Methode hinzu.
Nur @param, @return und eine Zeile Beschreibung.
```

### **Enterprise-Level Documentation**
```
Füge enterprise-grade Javadoc hinzu mit:
- Ausführlicher Beschreibung
- Alle @param/@return/@throws
- @apiNote mit detaillierten HTTP-Details
- @implNote für Implementation-Details
- @see References zu Standards/RFCs
- @author und @since
- Beispiel-Code in @code blocks
```

### **Legacy Code Documentation**
```
Füge Javadoc für diese Legacy-Methode hinzu.
Dokumentiere auch:
- @deprecated falls obsolete
- Migration-Hinweise
- Alternative Methoden via @see
- Breaking Changes in @apiNote
```

## Context-Specific Templates

### **REST Controller Context**
```
Füge REST-spezifische Javadoc hinzu:
- HTTP Verbs und Pfade
- Request/Response Content-Types
- Mögliche HTTP Status Codes
- CORS-Verhalten
- Rate-Limiting-Info
- Caching-Headers
```

### **Database Repository Context**
```
Füge Repository-spezifische Javadoc hinzu:
- Query-Performance Charakteristiken
- Transactional-Verhalten
- Locking-Strategien
- Index-Usage Hints
- Batch-Operation Details
```

### **Async/Reactive Context**
```
Füge Reactive-spezifische Javadoc hinzu:
- Threading-Model
- Backpressure-Verhalten
- Error-Handling in Streams
- Subscription-Lifecycle
- Performance-Charakteristiken
```

## Best Practices

### ✅ Gute Edit-Prompts
- Spezifischen Context angeben (Controller/Service/Entity)
- Framework-spezifische Details fordern
- Business-Fokus bei Services
- Technical-Fokus bei Infrastructure-Code

### ❌ Schlechte Edit-Prompts
- "Füge Javadoc hinzu" (zu allgemein)
- Keine Context-Information
- Fehlende Requirements für @tags

## Output-Qualität sicherstellen

### **Validation-Checklist**
- [ ] @param für alle Parameter vorhanden
- [ ] @return beschreibt alle möglichen Return-Werte
- [ ] @throws listet alle checked/unchecked Exceptions
- [ ] @apiNote bei REST-Endpoints mit HTTP-Details
- [ ] @since Tag mit korrekter Version
- [ ] @see References zu verwandten Klassen/Methoden
- [ ] Grammatik und Rechtschreibung korrekt
- [ ] Fachliche Korrektheit der Beschreibung

### **Team-Standards Template**
```
Füge Javadoc nach unserem Team-Standard hinzu:
- Erste Zeile: Kurze Zusammenfassung (< 80 Zeichen)
- Leerzeile
- Ausführliche Beschreibung
- Leerzeile vor @tags
- @param/@return/@throws in dieser Reihenfolge
- @since immer mit aktueller Version
- @see am Ende
- Deutsch für fachliche Begriffe, Englisch für technische
```

## Integration in Workflow

### **Pre-Commit Hook**
```bash
# Prüfe auf fehlende Javadoc bei public methods
mvn checkstyle:check -Dcheckstyle.violation.severity=error
```

### **IDE-Integration**
```xml
<!-- Maven: Javadoc-Pflicht für public APIs -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-javadoc-plugin</artifactId>
    <configuration>
        <failOnError>true</failOnError>
        <failOnWarnings>true</failOnWarnings>
    </configuration>
</plugin>
```