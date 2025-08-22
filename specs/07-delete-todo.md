# Feature 07: Todo löschen

> **Hinweis**: Die Code-Beispiele in dieser Spec sind framework-neutral. Siehe [00-framework-adaption-guide.md](00-framework-adaption-guide.md) für die Übersetzung in Angular, Vue oder React.

## Ziel
Benutzer können einzelne Todos über einen Löschen-Button entfernen, der bei Hover sichtbar wird.

## Beschreibung
Beim Hover über ein Todo-Element wird ein Löschen-Button (×) sichtbar. Klick auf den Button löscht das Todo sofort mit optimistic update und Backend-Synchronisation.

## Akzeptanzkriterien

### Hover-Funktionalität
- [ ] Löschen-Button (×) nur bei Hover über Todo-Element sichtbar
- [ ] Button mit CSS-Klasse `.destroy` gestylt
- [ ] Smooth Transition beim Ein-/Ausblenden

### Löschen-Funktionalität
- [ ] Klick auf × löscht Todo sofort aus UI (optimistic update)
- [ ] Backend-Request `DELETE /api/todos/{id}`
- [ ] Bei Backend-Fehler: Todo wird wieder angezeigt

### UI-Feedback
- [ ] Todo verschwindet sofort aus der Liste
- [ ] Loading-State während API-Call (optional)
- [ ] Keine Bestätigung nötig (wie TodoMVC Standard)

## Technische Spezifikationen

### TodoItem-Komponente Update

**Template-Struktur:**
```html
<li [CSS-Klassen: 'completed' wenn todo.completed, 'deleting' wenn isDeleting]>
  <div class="view">
    <input 
      class="toggle" 
      type="checkbox" 
      [checked bound zu todo.completed]
      [click event -> toggleTodo()]
      [disabled wenn isToggling || isDeleting]
    >
    <label>{{ todo.title }}</label>
    <button 
      class="destroy"
      [click event -> deleteTodo()]
      [disabled wenn isDeleting]
    ></button>
  </div>
</li>
```

**Komponenten-Logik:**
```typescript
export class TodoItemComponent {
  todo: Todo; // Als Prop/Input empfangen
  onTodoDeleted: (todoId: number) => void; // Event/Callback an Parent
  
  isToggling = false;
  isDeleting = false;
  
  constructor(private todoService: TodoService) {}
  
  deleteTodo(): void {
    if (this.isDeleting) return;
    
    this.isDeleting = true;
    
    // Optimistic update - notify parent to remove from list
    this.onTodoDeleted(this.todo.id);
    
    this.todoService.deleteTodo(this.todo.id).subscribe({
      next: () => {
        // Deletion confirmed - nothing to do (already removed)
        this.isDeleting = false;
      },
      error: (error) => {
        // Rollback - notify parent to re-add todo
        this.onTodoDeleted(-this.todo.id); // Negative ID signals rollback
        this.isDeleting = false;
        // Show error message
      }
    });
  }
}
```

### TodoList-Komponente Update

**Template-Struktur:**
```html
<section class="main" [anzeigen wenn todos.length > 0]>
  <ul class="todo-list">
    [Für jedes todo in todos:]
      <todo-item 
        [todo als prop übergeben]
        [todoDeleted callback -> handleTodoDeleted()]>
      </todo-item>
  </ul>
</section>
```

**Komponenten-Logik:**
```typescript
export class TodoListComponent {
  todos: Todo[] = [];
  private deletedTodos: Map<number, Todo> = new Map();
  
  handleTodoDeleted(todoId: number): void {
    if (todoId < 0) {
      // Rollback deletion
      const actualId = Math.abs(todoId);
      const deletedTodo = this.deletedTodos.get(actualId);
      if (deletedTodo) {
        this.todos.push(deletedTodo);
        this.deletedTodos.delete(actualId);
      }
    } else {
      // Optimistic deletion
      const index = this.todos.findIndex(t => t.id === todoId);
      if (index !== -1) {
        const deletedTodo = this.todos[index];
        this.deletedTodos.set(todoId, deletedTodo);
        this.todos.splice(index, 1);
      }
    }
  }
}
```

### TodoService Erweiterung

**Service/Store-Logik:**
```typescript
export class TodoService {
  
  deleteTodo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const todos = this.todos$.value;
        const filtered = todos.filter(t => t.id !== id);
        this.todos$.next(filtered);
      })
    );
  }
}
```

### Backend Delete Endpoint
```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteTodo(@PathVariable Long id) {
    boolean deleted = todoStorage.deleteById(id);
    if (!deleted) {
        return ResponseEntity.notFound().build();
    }
    return ResponseEntity.noContent().build();
}
```

## Testfälle

### Happy Flow
- [ ] Hover über Todo → Löschen-Button wird sichtbar
- [ ] Klick auf × → Todo verschwindet sofort aus Liste
- [ ] Backend erhält DELETE Request mit korrekter ID
- [ ] Todo ist permanent gelöscht

### Hover-Verhalten
- [ ] Kein Hover → Löschen-Button versteckt
- [ ] Mouse Enter → Button erscheint mit Transition
- [ ] Mouse Leave → Button verschwindet mit Transition
- [ ] Touch-Geräte → Button immer sichtbar (fallback)

### Optimistic Updates
- [ ] Klick → Todo sofort aus UI entfernt
- [ ] Backend Success → Todo bleibt gelöscht
- [ ] Backend Error → Todo wird wieder angezeigt

### Multiple Todos
- [ ] Todo 1 löschen → Andere Todos unverändert
- [ ] Mehrere Todos schnell löschen → Alle korrekt verarbeitet
- [ ] Letztes Todo löschen → Liste wird leer

### Error Scenarios
- [ ] Backend 404 → Todo als gelöscht behandeln (idempotent)
- [ ] Backend 500 → Todo wieder anzeigen + Fehlermeldung
- [ ] Network Error → Rollback + Retry-Option

### Edge Cases
- [ ] Löschen während Toggle-Operation → Operation abbrechen
- [ ] Schnelle Doppelklicks → Nur ein Delete-Request
- [ ] Todo bereits gelöscht → Graceful handling

### Performance
- [ ] 100+ Todos → Smooth hover und delete
- [ ] Frequent deletions → Efficient re-rendering

## CSS-Anpassungen (aus main.css)
```css
.todo-list li .destroy {
  display: none;
  position: absolute;
  top: 0;
  right: 10px;
  width: 40px;
  height: 40px;
  cursor: pointer;
}

.todo-list li:hover .destroy {
  display: block;
}

.todo-list li.deleting {
  opacity: 0.5;
}

/* Touch devices - always show destroy button */
@media (hover: none) {
  .todo-list li .destroy {
    display: block;
  }
}
```

## Definition of Done
- [ ] Löschen-Button erscheint bei Hover über Todo
- [ ] Klick löscht Todo sofort aus UI
- [ ] Backend Integration über DELETE /api/todos/{id}
- [ ] Optimistic updates mit Rollback-Mechanismus
- [ ] Error handling für alle Fehlerfälle
- [ ] Touch-Geräte Unterstützung (immer sichtbarer Button)
- [ ] Smooth CSS Transitions
- [ ] Unit Tests für Component und Service
- [ ] Integration Tests mit Backend
- [ ] Performance optimization

## Abhängigkeiten
- 06-toggle-todo.md (TodoItemComponent mit Checkbox)
- 05-display-todos.md (TodoListComponent)
- 02-todo-model.md (Backend DELETE /api/todos/{id})

## Nachfolgende Features
- 08-edit-todo.md (Todo bearbeiten)
- 12-clear-completed.md (Alle erledigten Todos löschen)