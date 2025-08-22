# Feature 04: Neues Todo erstellen

## Ziel
Eingabefeld für neue Todos implementieren mit Validierung und Backend-Integration.

## Beschreibung
Benutzer können neue Todos über ein Eingabefeld am oberen Rand der App erstellen. Enter-Taste erstellt das Todo, das Eingabefeld wird geleert und fokussiert.

## Akzeptanzkriterien

### Input-Feld
- [ ] Eingabefeld mit Placeholder "What needs to be done?"
- [ ] Auto-Focus beim Laden der Seite (autofocus)
- [ ] Enter-Taste erstellt neues Todo
- [ ] Eingabefeld wird nach Erstellung geleert

### Validierung
- [ ] Input wird mit `.trim()` bereinigt
- [ ] Leere Eingaben werden nicht als Todo erstellt
- [ ] Nur Leerzeichen werden abgelehnt
- [ ] Maximale Länge: 500 Zeichen

### Backend-Integration
- [ ] HTTP POST zu `/api/todos` bei Enter
- [ ] Todo wird zur lokalen Liste hinzugefügt
- [ ] Optimistische Updates (UI sofort aktualisieren)
- [ ] Fehlerbehandlung bei API-Fehlern

### UI-Feedback
- [ ] Loading-State während API-Call
- [ ] Erfolgreiche Erstellung visuell feedback
- [ ] Fehlermeldung bei Validierungsfehlern

## Technische Spezifikationen

### Frontend Template-Struktur
```html
<section class="todoapp">
  <header class="header">
    <h1>todos</h1>
    <input 
      class="new-todo" 
      placeholder="What needs to be done?" 
      autofocus
      <!-- Framework-spezifisches Data-Binding -->
      <!-- Enter-Key Event Handler -->
      <!-- Disabled während API-Call -->
</section>
```

### Component Logic
```typescript
export class TodoAppComponent {
  newTodoTitle: string = '';
  isCreating: boolean = false;
  
  constructor(private todoService: TodoService) {}
  
  createTodo(): void {
    const title = this.newTodoTitle.trim();
    
    if (!title || title.length > 500) {
      return; // Validation failed
    }
    
    this.isCreating = true;
    
    this.todoService.createTodo(title).subscribe({
      next: (todo) => {
        this.newTodoTitle = '';
        this.isCreating = false;
        // Todo wird über Service zur Liste hinzugefügt
      },
      error: (error) => {
        this.isCreating = false;
        // Fehlerbehandlung
      }
    });
  }
}
```

### TodoService (Gerüst)
```typescript
@Injectable()
export class TodoService {
  private apiUrl = '/api/todos';
  
  constructor(private http: HttpClient) {}
  
  createTodo(title: string): Observable<Todo> {
    return this.http.post<Todo>(this.apiUrl, { title });
  }
}
```

## Testfälle

### Happy Flow
- [ ] Eingabe "Learn Angular" + Enter → Todo wird erstellt
- [ ] Eingabefeld wird geleert nach Erstellung
- [ ] Focus bleibt im Eingabefeld
- [ ] Backend erhält POST Request mit korrekten Daten

### Validierung
- [ ] Leere Eingabe + Enter → Kein Todo erstellt
- [ ] Nur Leerzeichen "   " + Enter → Kein Todo erstellt  
- [ ] 501 Zeichen + Enter → Fehlermeldung, kein Todo
- [ ] "  Valid Todo  " → Todo mit "Valid Todo" (getrimmt)

### Backend-Integration
- [ ] Erfolgreiche API Response → Todo in Liste sichtbar
- [ ] API Fehler 400 → Fehlermeldung anzeigen
- [ ] Network Error → Retry-Option oder Offline-Meldung

### Edge Cases
- [ ] Sehr schnelle Enter-Drücke → Keine Duplikate
- [ ] Gleichzeitiges Erstellen mehrerer Todos → Serialisierung
- [ ] Sonderzeichen & HTML → Korrekte Escaping

### UI-States
- [ ] Loading-State: Input disabled, Spinner sichtbar
- [ ] Error-State: Fehlermeldung unter Input
- [ ] Success-State: Kurzes visuelles Feedback

## Definition of Done
- [ ] Eingabefeld funktional mit Auto-Focus
- [ ] Validierung verhindert leere/ungültige Todos
- [ ] Backend-Integration über HTTP POST
- [ ] Optimistische Updates implementiert
- [ ] Fehlerbehandlung für alle Szenarien
- [ ] Loading-States für bessere UX
- [ ] Unit Tests für Component und Service
- [ ] Input wird nach Erstellung geleert und fokussiert

## Abhängigkeiten
- 03-frontend-setup.md (Angular Components verfügbar)
- 02-todo-model.md (Backend API POST /api/todos)

## Nachfolgende Features
- 05-display-todos.md (Erstellte Todos anzeigen)