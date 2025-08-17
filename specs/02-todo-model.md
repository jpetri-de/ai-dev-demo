# Feature 02: Todo Model & REST API

## Ziel
Todo-Datenmodell und alle REST API Endpunkte implementieren mit In-Memory Storage.

## Beschreibung
Implementierung des Todo-Interfaces und aller CRUD-Operationen über REST API. Daten werden nur im Speicher gehalten ohne Datenbankanbindung.

## Akzeptanzkriterien

### Todo Model
- [ ] Todo-Klasse mit `title` (String) und `completed` (boolean)
- [ ] Eindeutige ID-Generierung (Long, auto-increment)
- [ ] JSON Serialisierung/Deserialisierung funktional

### REST Endpoints
- [ ] `GET /api/todos` - Alle Todos abrufen
- [ ] `POST /api/todos` - Neues Todo erstellen  
- [ ] `PUT /api/todos/{id}` - Todo aktualisieren
- [ ] `DELETE /api/todos/{id}` - Todo löschen
- [ ] `PUT /api/todos/{id}/toggle` - Todo Status umschalten
- [ ] `DELETE /api/todos/completed` - Alle erledigten Todos löschen

### In-Memory Storage
- [ ] Thread-safe List<Todo> Implementation
- [ ] ID-Counter für eindeutige IDs
- [ ] Grunddaten beim Start (optional für Testing)

### CORS Konfiguration
- [ ] CORS für localhost:4200 konfiguriert
- [ ] Alle HTTP-Methoden erlaubt (GET, POST, PUT, DELETE)

## Technische Spezifikationen

### Todo Model
```java
public class Todo {
    private Long id;
    private String title;
    private boolean completed;
    
    // Constructors, Getters, Setters
}
```

### Storage Service
```java
@Service
public class TodoStorageService {
    private final List<Todo> todos = Collections.synchronizedList(new ArrayList<>());
    private final AtomicLong idCounter = new AtomicLong(1);
    
    // CRUD operations
}
```

### Validierung
- `title` darf nicht null oder leer sein (nach trim())
- `title` max. 500 Zeichen
- `id` muss für Updates existieren

## Testfälle

### Happy Flow
- [ ] POST neues Todo mit title "Test" → Status 201, Todo mit ID zurück
- [ ] GET alle Todos → Status 200, Liste mit erstelltem Todo
- [ ] PUT Todo/{id} completed=true → Status 200, Todo aktualisiert
- [ ] DELETE Todo/{id} → Status 204, Todo entfernt

### Edge Cases
- [ ] POST mit leerem title → Status 400, Fehlermeldung
- [ ] PUT mit nicht-existierender ID → Status 404
- [ ] DELETE mit nicht-existierender ID → Status 404
- [ ] Title mit 500+ Zeichen → Status 400, Validierungsfehler

### Bulk Operations
- [ ] DELETE /api/todos/completed → Nur completed Todos entfernt
- [ ] PUT /api/todos/{id}/toggle → completed Status umgeschaltet

### Fehlerfälle
- [ ] Malformed JSON → Status 400
- [ ] Concurrent Modifications → Thread-Safety gewährleistet

## API Dokumentation

### GET /api/todos
```json
Response 200:
[
  {
    "id": 1,
    "title": "Learn Angular",
    "completed": false
  }
]
```

### POST /api/todos
```json
Request:
{
  "title": "New Todo"
}

Response 201:
{
  "id": 2,
  "title": "New Todo", 
  "completed": false
}
```

## Definition of Done
- [ ] Alle 6 REST Endpunkte implementiert und getestet
- [ ] In-Memory Storage thread-safe
- [ ] Input-Validierung funktional
- [ ] CORS für Frontend konfiguriert
- [ ] API-Tests für alle Endpunkte
- [ ] Fehlerbehandlung implementiert

## Abhängigkeiten
- 01-backend-setup.md (Spring Boot Setup)

## Nachfolgende Features
- 03-frontend-setup.md (Angular Frontend Setup)