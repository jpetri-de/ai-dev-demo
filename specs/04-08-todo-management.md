# Feature 04-08: Vollständiges Todo-Management

## Ziel
Vollständige CRUD-Funktionalität für Todos implementieren: Erstellen, Anzeigen, Toggle, Löschen und Bearbeiten in einer integrierten Lösung.

## Beschreibung
Diese kombinierte Feature umfasst alle grundlegenden Todo-Operationen:
- **Erstellen**: Eingabefeld für neue Todos mit Enter-Taste
- **Anzeigen**: Liste aller Todos mit korrektem Styling
- **Toggle**: Checkbox für completed/active Status 
- **Löschen**: Hover-Button zum Entfernen einzelner Todos
- **Bearbeiten**: Doppelklick für Inline-Editing

Alle Operationen verwenden optimistic updates mit Backend-Synchronisation und Rollback bei Fehlern.

## Akzeptanzkriterien

### 1. Todo Erstellen (Feature 04)
- [ ] Eingabefeld mit Placeholder "What needs to be done?"
- [ ] Auto-Focus beim Laden der Seite (autofocus)
- [ ] Enter-Taste erstellt neues Todo
- [ ] Eingabefeld wird nach Erstellung geleert
- [ ] Input wird mit `.trim()` bereinigt
- [ ] Leere Eingaben werden nicht als Todo erstellt
- [ ] Maximale Länge: 500 Zeichen
- [ ] HTTP POST zu `/api/todos` bei Enter
- [ ] Optimistische Updates (UI sofort aktualisieren)
- [ ] Loading-State während API-Call
- [ ] Fehlerbehandlung bei API-Fehlern

### 2. Todo-Liste Anzeigen (Feature 05)
- [ ] Alle Todos werden vom Backend geladen (`GET /api/todos`)
- [ ] TodoListComponent zeigt Liste aller Todos
- [ ] TodoItemComponent rendert einzelne Todo-Elemente
- [ ] Erledigte Todos: Text durchgestrichen (CSS class `completed`)
- [ ] Aktive Todos: Normaler Text
- [ ] Efficient rendering mit `*ngFor` und `trackBy`
- [ ] Reactive state management mit BehaviorSubject
- [ ] Memory leak prevention (unsubscribe)

### 3. Todo Toggle (Feature 06)
- [ ] Klick auf Checkbox schaltet `completed` Status um
- [ ] Visueller Status ändert sich sofort (optimistic update)
- [ ] Backend-Update via `PUT /api/todos/{id}/toggle`
- [ ] Bei Backend-Fehler: Status wird zurückgerollt
- [ ] Checkbox visuell checked/unchecked
- [ ] Button disabled während API-Call

### 4. Todo Löschen (Feature 07)
- [ ] Löschen-Button (×) nur bei Hover über Todo-Element sichtbar
- [ ] Klick auf × löscht Todo sofort aus UI (optimistic update)
- [ ] Backend-Request `DELETE /api/todos/{id}`
- [ ] Bei Backend-Fehler: Todo wird wieder angezeigt
- [ ] Smooth Transition beim Ein-/Ausblenden
- [ ] Touch-Geräte: Button immer sichtbar (fallback)

### 5. Todo Bearbeiten (Feature 08)
- [ ] Doppelklick auf Todo-Label aktiviert Bearbeitungsmodus
- [ ] Todo-Element bekommt CSS-Klasse `.editing`
- [ ] Eingabefeld wird angezeigt und fokussiert
- [ ] Enter-Taste speichert Änderungen
- [ ] Blur (Klick außerhalb) speichert Änderungen
- [ ] Escape-Taste bricht Bearbeitung ab
- [ ] Leerer Text (nach trim) löscht das Todo
- [ ] Backend-Integration via `PUT /api/todos/{id}`

## Technische Spezifikationen

### Todo Interface (TypeScript)
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
  title?: string;
  completed?: boolean;
}
```

### TodoAppComponent (Eingabefeld & Container)
```typescript
@Component({
  selector: 'app-todo-app',
  template: `
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <input 
          class="new-todo" 
          placeholder="What needs to be done?" 
          autofocus
          [(ngModel)]="newTodoTitle"
          (keyup.enter)="createTodo()"
          [disabled]="isCreating"
          #newTodoInput
        >
      </header>
      
      <app-todo-list 
        [todos]="todos$ | async"
        (todoDeleted)="handleTodoDeleted($event)"
        (todoUpdated)="handleTodoUpdated($event)">
      </app-todo-list>
    </section>
  `
})
export class TodoAppComponent implements OnInit {
  newTodoTitle: string = '';
  isCreating: boolean = false;
  todos$ = this.todoService.todos$;
  
  constructor(private todoService: TodoService) {}
  
  ngOnInit(): void {
    this.todoService.loadTodos();
  }
  
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
        // Todo automatisch zur Liste hinzugefügt über Service
      },
      error: (error) => {
        this.isCreating = false;
        // Fehlerbehandlung
        console.error('Failed to create todo:', error);
      }
    });
  }
  
  handleTodoDeleted(todoId: number): void {
    // Wird vom Service automatisch verwaltet
  }
  
  handleTodoUpdated(todo: Todo): void {
    // Wird vom Service automatisch verwaltet  
  }
}
```

### TodoListComponent (Liste & Container)
```typescript
@Component({
  selector: 'app-todo-list',
  template: `
    <section class="main" *ngIf="todos && todos.length > 0">
      <ul class="todo-list">
        <app-todo-item 
          *ngFor="let todo of todos; trackBy: trackByTodoId"
          [todo]="todo"
          (todoToggled)="handleTodoToggled($event)"
          (todoDeleted)="handleTodoDeleted($event)"
          (todoUpdated)="handleTodoUpdated($event)">
        </app-todo-item>
      </ul>
    </section>
  `
})
export class TodoListComponent {
  @Input() todos: Todo[] | null = null;
  @Output() todoToggled = new EventEmitter<Todo>();
  @Output() todoDeleted = new EventEmitter<number>();
  @Output() todoUpdated = new EventEmitter<Todo>();
  
  trackByTodoId(index: number, todo: Todo): number {
    return todo.id;
  }
  
  handleTodoToggled(todo: Todo): void {
    this.todoToggled.emit(todo);
  }
  
  handleTodoDeleted(todoId: number): void {
    this.todoDeleted.emit(todoId);
  }
  
  handleTodoUpdated(todo: Todo): void {
    this.todoUpdated.emit(todo);
  }
}
```

### TodoItemComponent (Vollständiges Item)
```typescript
@Component({
  selector: 'app-todo-item',
  template: `
    <li [class.completed]="todo.completed" 
        [class.editing]="isEditing"
        [class.deleting]="isDeleting">
      
      <!-- View Mode -->
      <div class="view" *ngIf="!isEditing">
        <input 
          class="toggle" 
          type="checkbox" 
          [checked]="todo.completed"
          (click)="toggleTodo()"
          [disabled]="isToggling || isDeleting || isSaving"
        >
        <label (dblclick)="startEditing()">{{ todo.title }}</label>
        <button 
          class="destroy"
          (click)="deleteTodo()"
          [disabled]="isDeleting || isSaving"
        ></button>
      </div>
      
      <!-- Edit Mode -->
      <input 
        *ngIf="isEditing"
        class="edit"
        [value]="editText"
        (input)="editText = $any($event.target).value"
        (keyup.enter)="saveEdit()"
        (keyup.escape)="cancelEdit()"
        (blur)="saveEdit()"
        #editInput
      >
    </li>
  `,
  styles: [`
    .editing .view {
      display: none;
    }
    li.deleting {
      opacity: 0.5;
    }
  `]
})
export class TodoItemComponent implements AfterViewInit {
  @Input() todo!: Todo;
  @Output() todoToggled = new EventEmitter<Todo>();
  @Output() todoDeleted = new EventEmitter<number>();
  @Output() todoUpdated = new EventEmitter<Todo>();
  @ViewChild('editInput', { static: false }) editInput?: ElementRef;
  
  isToggling = false;
  isDeleting = false;
  isEditing = false;
  isSaving = false;
  editText = '';
  originalTitle = '';
  
  constructor(private todoService: TodoService) {}
  
  ngAfterViewInit(): void {
    if (this.isEditing && this.editInput) {
      this.editInput.nativeElement.focus();
      this.editInput.nativeElement.select();
    }
  }
  
  // Toggle Functionality
  toggleTodo(): void {
    if (this.isToggling || this.isDeleting || this.isSaving) return;
    
    const originalStatus = this.todo.completed;
    
    // Optimistic update
    this.todo.completed = !this.todo.completed;
    this.isToggling = true;
    
    this.todoService.toggleTodo(this.todo.id).subscribe({
      next: (updatedTodo) => {
        this.todo = updatedTodo;
        this.isToggling = false;
        this.todoToggled.emit(this.todo);
      },
      error: (error) => {
        // Rollback optimistic update
        this.todo.completed = originalStatus;
        this.isToggling = false;
        console.error('Failed to toggle todo:', error);
      }
    });
  }
  
  // Delete Functionality
  deleteTodo(): void {
    if (this.isDeleting || this.isSaving) return;
    
    this.isDeleting = true;
    
    // Optimistic update wird vom Parent/Service gehandelt
    this.todoService.deleteTodo(this.todo.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.todoDeleted.emit(this.todo.id);
      },
      error: (error) => {
        this.isDeleting = false;
        console.error('Failed to delete todo:', error);
      }
    });
  }
  
  // Edit Functionality
  startEditing(): void {
    if (this.isDeleting || this.isSaving || this.isToggling) return;
    
    this.isEditing = true;
    this.editText = this.todo.title;
    this.originalTitle = this.todo.title;
    
    // Focus input in next tick
    setTimeout(() => {
      if (this.editInput) {
        this.editInput.nativeElement.focus();
        this.editInput.nativeElement.select();
      }
    });
  }
  
  saveEdit(): void {
    if (!this.isEditing || this.isSaving) return;
    
    const trimmedText = this.editText.trim();
    
    // Empty text deletes the todo
    if (!trimmedText) {
      this.deleteTodo();
      return;
    }
    
    // No change - just exit edit mode
    if (trimmedText === this.originalTitle) {
      this.cancelEdit();
      return;
    }
    
    // Validate length
    if (trimmedText.length > 500) {
      // Show validation error (could emit validation event)
      return;
    }
    
    this.isSaving = true;
    
    // Optimistic update
    const originalTitle = this.todo.title;
    this.todo.title = trimmedText;
    this.isEditing = false;
    
    this.todoService.updateTodo(this.todo.id, trimmedText).subscribe({
      next: (updatedTodo) => {
        this.todo = updatedTodo;
        this.isSaving = false;
        this.todoUpdated.emit(this.todo);
      },
      error: (error) => {
        // Rollback
        this.todo.title = originalTitle;
        this.isEditing = true;
        this.editText = this.originalTitle;
        this.isSaving = false;
        console.error('Failed to update todo:', error);
      }
    });
  }
  
  cancelEdit(): void {
    this.isEditing = false;
    this.editText = '';
    this.originalTitle = '';
  }
}
```

### TodoService (Vollständige Service-Integration)
```typescript
@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private apiUrl = '/api/todos';
  private todosSubject = new BehaviorSubject<Todo[]>([]);
  public todos$ = this.todosSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  // Load all todos
  loadTodos(): void {
    this.http.get<Todo[]>(this.apiUrl).subscribe({
      next: (todos) => {
        this.todosSubject.next(todos);
      },
      error: (error) => {
        console.error('Failed to load todos:', error);
      }
    });
  }
  
  // Create new todo
  createTodo(title: string): Observable<Todo> {
    const request: CreateTodoRequest = { title };
    
    return this.http.post<Todo>(this.apiUrl, request).pipe(
      tap(newTodo => {
        const currentTodos = this.todosSubject.value;
        this.todosSubject.next([...currentTodos, newTodo]);
      })
    );
  }
  
  // Toggle todo completion
  toggleTodo(id: number): Observable<Todo> {
    return this.http.put<Todo>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      tap(updatedTodo => {
        const todos = this.todosSubject.value;
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
          todos[index] = updatedTodo;
          this.todosSubject.next([...todos]);
        }
      })
    );
  }
  
  // Update todo title
  updateTodo(id: number, title: string): Observable<Todo> {
    const request: UpdateTodoRequest = { title };
    
    return this.http.put<Todo>(`${this.apiUrl}/${id}`, request).pipe(
      tap(updatedTodo => {
        const todos = this.todosSubject.value;
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
          todos[index] = updatedTodo;
          this.todosSubject.next([...todos]);
        }
      })
    );
  }
  
  // Delete todo
  deleteTodo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const todos = this.todosSubject.value;
        const filtered = todos.filter(t => t.id !== id);
        this.todosSubject.next(filtered);
      })
    );
  }
}
```

### Backend-Endpoints (Zusammenfassung)
```java
@RestController
@RequestMapping("/api/todos")
public class TodoController {
    
    @GetMapping
    public List<Todo> getAllTodos() { ... }
    
    @PostMapping
    public ResponseEntity<Todo> createTodo(@Valid @RequestBody CreateTodoRequest request) { ... }
    
    @PutMapping("/{id}")
    public ResponseEntity<Todo> updateTodo(@PathVariable Long id, @Valid @RequestBody UpdateTodoRequest request) { ... }
    
    @PutMapping("/{id}/toggle")
    public ResponseEntity<Todo> toggleTodo(@PathVariable Long id) { ... }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Long id) { ... }
}
```

## Testfälle

### Happy Flow Scenarios
- [ ] Seite laden → Auto-focus auf Eingabefeld
- [ ] "Learn Angular" eingeben + Enter → Todo erstellt und in Liste sichtbar
- [ ] Checkbox klicken → Todo als completed markiert, Text durchgestrichen
- [ ] Über Todo hovern → Löschen-Button erscheint
- [ ] Löschen-Button klicken → Todo verschwindet aus Liste
- [ ] Todo-Label doppelklicken → Edit-Modus aktiviert
- [ ] Text ändern + Enter → Todo aktualisiert

### Validierung & Edge Cases
- [ ] Leere Eingabe + Enter → Kein Todo erstellt
- [ ] 501 Zeichen eingeben → Validierungsfehler
- [ ] Todo bearbeiten: Leerer Text → Todo gelöscht
- [ ] Schnelle Doppelklicks → Keine Duplikate/Race Conditions
- [ ] Edit-Modus: Escape → Änderungen verworfen

### Backend-Integration
- [ ] Jede Operation sendet korrekten HTTP Request
- [ ] Erfolgreiche API Response → UI korrekt aktualisiert
- [ ] API-Fehler → Optimistic Update zurückgerollt
- [ ] Network-Fehler → Benutzerfreundliche Fehlermeldung

### Performance & UX
- [ ] 100+ Todos → Smooth rendering ohne Lag
- [ ] Optimistic Updates → Sofortiges UI-Feedback
- [ ] Loading-States → Buttons disabled während API-Calls
- [ ] Memory Leaks → Proper subscription cleanup

## CSS-Styling (Verwendung von main.css)
```css
/* Input field styling */
.new-todo {
  position: relative;
  margin: 0;
  width: 100%;
  font-size: 24px;
  font-family: inherit;
  padding: 16px 16px 16px 60px;
  border: none;
  background: rgba(0, 0, 0, 0.003);
  box-shadow: inset 0 -2px 1px rgba(0,0,0,0.03);
}

/* Todo list styling */
.todo-list li.completed label {
  color: #d9d9d9;
  text-decoration: line-through;
}

.todo-list li .destroy {
  display: none;
  position: absolute;
  top: 0;
  right: 10px;
}

.todo-list li:hover .destroy {
  display: block;
}

/* Edit mode styling */
.todo-list li.editing .view {
  display: none;
}

.todo-list li .edit {
  display: block;
  width: calc(100% - 43px);
  padding: 12px 16px;
  margin: 0 0 0 43px;
  font-size: 24px;
  border: 1px solid #999;
}

/* Touch devices - always show destroy button */
@media (hover: none) {
  .todo-list li .destroy {
    display: block;
  }
}
```

## Definition of Done
- [ ] Eingabefeld erstellt neue Todos mit Auto-Focus
- [ ] Todo-Liste zeigt alle Todos mit korrektem Styling
- [ ] Checkbox-Toggle funktioniert mit sofortigem UI-Update
- [ ] Hover-Delete funktioniert (touch-friendly fallback)
- [ ] Doppelklick-Edit mit Enter/Escape/Blur-Handling
- [ ] Vollständige Backend-Integration für alle Operationen
- [ ] Optimistic Updates mit Rollback bei Fehlern
- [ ] Umfassendes Error Handling und Loading States
- [ ] Input-Validierung (Länge, Leerzeichen)
- [ ] Performance-Optimierung (trackBy, OnPush, etc.)
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Unit Tests für alle Components und Service
- [ ] Integration Tests mit Backend
- [ ] Memory leak prevention (subscription cleanup)

## Abhängigkeiten
- 01-backend-setup.md (Backend verfügbar)
- 02-todo-model.md (Todo Entity und REST-Endpoints)
- 03-frontend-setup.md (Angular Application Setup)

## Nachfolgende Features
- 09-counter.md (Active Todo Counter)
- 10-filter-todos.md (Filter-Funktionalität)
- 11-toggle-all.md (Alle Todos auf einmal toggle)
- 12-clear-completed.md (Alle completed Todos löschen)

## Integration Notes
Diese kombinierte Feature implementiert das Herzstück der TodoMVC-Anwendung. Alle nachfolgenden Features (Counter, Filter, Toggle-All, Clear-Completed) bauen auf dieser Basis auf und erweitern die bestehende Funktionalität, ohne die Kernlogik zu verändern.

Die Service-basierte Architektur mit BehaviorSubject stellt sicher, dass alle UI-Components automatisch auf Datenänderungen reagieren, was die Integration nachfolgender Features erheblich vereinfacht.