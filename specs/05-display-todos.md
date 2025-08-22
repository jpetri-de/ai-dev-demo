# Feature 05: Todo-Liste anzeigen

> **Hinweis**: Die Code-Beispiele in dieser Spec sind framework-neutral. Siehe [00-framework-adaption-guide.md](00-framework-adaption-guide.md) für die Übersetzung in Angular, Vue oder React.

## Ziel
Alle Todos in einer Liste anzeigen mit korrekter Darstellung von erledigten und aktiven Todos.

## Beschreibung
TodoListComponent lädt und zeigt alle Todos vom Backend an. TodoItemComponent rendert einzelne Todos mit korrektem Styling für completed/active States.

## Akzeptanzkriterien

### Todo-Liste
- [ ] Alle Todos werden vom Backend geladen (`GET /api/todos`)
- [ ] TodoListComponent zeigt Liste aller Todos
- [ ] TodoItemComponent rendert einzelne Todo-Elemente
- [ ] Correct styling für completed vs. active todos

### UI States
- [ ] Erledigte Todos: Text durchgestrichen (CSS class `completed`)
- [ ] Aktive Todos: Normaler Text
- [ ] Leere Liste: Keine Todos sichtbar (main/footer später versteckt)

### Performance
- [ ] Efficient rendering mit Listen-Iteration und Track-by-Funktionen
- [ ] Keine unnötigen API-Aufrufe
- [ ] Lazy loading preparation (falls später benötigt)

## Technische Spezifikationen

### Todo Interface (TypeScript)
```typescript
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}
```

### TodoList-Komponente

**Template-Struktur:**
```html
<section class="main" [wenn todos nicht leer]>
  <ul class="todo-list">
    [Für jedes todo in todos:]
      <todo-item [todo als prop übergeben]></todo-item>
  </ul>
</section>
```

**Komponenten-Logik:**
```typescript
export class TodoListComponent {
  todos: Todo[] = [];
  
  constructor(private todoService: TodoService) {}
  
  onComponentInit(): void {
    this.loadTodos();
  }
  
  private loadTodos(): void {
    this.todoService.getTodos().subscribe(todos => {
      this.todos = todos;
    });
  }
  
  // Performance-Optimierung für Listen-Rendering
  trackByTodoId(todo: Todo): number {
    return todo.id;
  }
}
```

### TodoItem-Komponente

**Template-Struktur:**
```html
<li [CSS-Klasse 'completed' wenn todo.completed]>
  <div class="view">
    <input 
      class="toggle" 
      type="checkbox" 
      [checked bound zu todo.completed]
      readonly
    >
    <label>{{ todo.title }}</label>
    <button class="destroy"></button>
  </div>
</li>
```

**Komponenten-Logik:**
```typescript
export class TodoItemComponent {
  todo: Todo; // Als Prop/Input empfangen
}
```

### TodoService Erweiterung

**Service/Store-Logik:**
```typescript
export class TodoService {
  private todos: Todo[] = [];
  
  getTodos(): Observable<Todo[]> {
    return this.httpClient.get<Todo[]>(this.apiUrl).pipe(
      tap(todos => this.todos = todos)
    );
  }
  
  createTodo(title: string): Observable<Todo> {
    return this.httpClient.post<Todo>(this.apiUrl, { title }).pipe(
      tap(newTodo => {
        this.todos = [...this.todos, newTodo];
      })
    );
  }
}
```

## Testfälle

### Happy Flow
- [ ] App lädt → GET `/api/todos` wird aufgerufen
- [ ] 3 Todos im Backend → 3 Todo-Items werden gerendert
- [ ] Completed Todo → Text durchgestrichen dargestellt
- [ ] Active Todo → Text normal dargestellt

### State Management
- [ ] Neues Todo erstellt → Sofort in Liste sichtbar
- [ ] Backend-Update → Liste wird automatisch aktualisiert
- [ ] Concurrent Updates → Konsistente Darstellung

### Empty States
- [ ] Keine Todos im Backend → Leere Liste (main section versteckt)
- [ ] Alle Todos gelöscht → Liste wird leer

### Error Handling
- [ ] Backend nicht erreichbar → Fehlermeldung oder Offline-State
- [ ] Malformed Response → Graceful fallback
- [ ] Network timeout → Retry-Mechanismus

### Performance
- [ ] 100+ Todos → Smooth rendering ohne Lag
- [ ] Frequent updates → Efficient change detection
- [ ] Memory leaks → Proper subscription cleanup

## CSS-Klassen (aus resources/css/main.css)
```css
.todo-list li.completed label {
  text-decoration: line-through;
}

.todo-list li .toggle {
  /* Checkbox styling */
}

.todo-list li .destroy {
  /* Delete button (initially hidden) */
}
```

## Definition of Done
- [ ] TodoListComponent lädt alle Todos beim Start
- [ ] TodoItemComponent rendert einzelne Todos korrekt
- [ ] Completed/Active styling funktioniert
- [ ] Reactive state management mit BehaviorSubject
- [ ] Performance optimization mit trackBy
- [ ] Error handling für API-Fehler
- [ ] Unit Tests für beide Components
- [ ] Integration mit TodoService
- [ ] Memory leak prevention (unsubscribe)

## Abhängigkeiten
- 04-create-todo.md (TodoService mit createTodo)
- 03-frontend-setup.md (Angular Components)
- 02-todo-model.md (Backend GET /api/todos)

## Nachfolgende Features
- 06-toggle-todo.md (Todo als erledigt markieren)
- 07-delete-todo.md (Todo löschen)