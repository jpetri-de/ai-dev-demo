# Feature 06: Todo als erledigt markieren

## Ziel
Benutzer können Todos durch Klick auf die Checkbox als erledigt/nicht erledigt markieren.

## Beschreibung
Klick auf die Checkbox eines Todos schaltet den `completed` Status um. Das UI wird sofort aktualisiert und der neue Status wird an das Backend gesendet.

## Akzeptanzkriterien

### Checkbox-Funktionalität
- [ ] Klick auf Checkbox schaltet `completed` Status um
- [ ] Visueller Status ändert sich sofort (optimistic update)
- [ ] Backend-Update via `PUT /api/todos/{id}/toggle`
- [ ] Bei Backend-Fehler: Status wird zurückgerollt

### UI-Updates
- [ ] Completed Todo: CSS-Klasse `completed` hinzugefügt
- [ ] Active Todo: CSS-Klasse `completed` entfernt
- [ ] Text-Durchstreichung bei completed todos
- [ ] Checkbox visuell checked/unchecked

### Error Handling
- [ ] Backend-Fehler: Optimistic update rückgängig machen
- [ ] Network-Fehler: Retry-Mechanismus
- [ ] Concurrent updates: Latest wins strategy

## Technische Spezifikationen

### TodoItemComponent Update
```typescript
@Component({
  selector: 'app-todo-item',
  template: `
    <li [class.completed]="todo.completed">
      <div class="view">
        <input 
          class="toggle" 
          type="checkbox" 
          [checked]="todo.completed"
          (click)="toggleTodo()"
          [disabled]="isToggling"
        >
        <label>{{ todo.title }}</label>
        <button class="destroy"></button>
      </div>
    </li>
  `
})
export class TodoItemComponent {
  @Input() todo!: Todo;
  isToggling = false;
  
  constructor(private todoService: TodoService) {}
  
  toggleTodo(): void {
    if (this.isToggling) return;
    
    const originalStatus = this.todo.completed;
    
    // Optimistic update
    this.todo.completed = !this.todo.completed;
    this.isToggling = true;
    
    this.todoService.toggleTodo(this.todo.id).subscribe({
      next: (updatedTodo) => {
        this.todo = updatedTodo;
        this.isToggling = false;
      },
      error: (error) => {
        // Rollback optimistic update
        this.todo.completed = originalStatus;
        this.isToggling = false;
        // Show error message
      }
    });
  }
}
```

### TodoService Erweiterung
```typescript
@Injectable()
export class TodoService {
  
  toggleTodo(id: number): Observable<Todo> {
    return this.http.put<Todo>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      tap(updatedTodo => {
        const todos = this.todos$.value;
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
          todos[index] = updatedTodo;
          this.todos$.next([...todos]);
        }
      })
    );
  }
}
```

### Backend Toggle Endpoint
```java
@PutMapping("/{id}/toggle")
public ResponseEntity<Todo> toggleTodo(@PathVariable Long id) {
    Todo todo = todoStorage.findById(id);
    if (todo == null) {
        return ResponseEntity.notFound().build();
    }
    
    todo.setCompleted(!todo.isCompleted());
    todoStorage.update(todo);
    
    return ResponseEntity.ok(todo);
}
```

## Testfälle

### Happy Flow
- [ ] Active Todo klicken → Wird completed, text durchgestrichen
- [ ] Completed Todo klicken → Wird active, text normal
- [ ] Backend erhält PUT Request mit korrekter ID
- [ ] Liste zeigt aktuellen Status korrekt an

### Optimistic Updates
- [ ] Klick → UI ändert sich sofort (vor Backend Response)
- [ ] Backend Success → Status bleibt geändert
- [ ] Backend Error → Status wird zurückgerollt

### Multiple Todos
- [ ] Todo 1 toggle → Andere Todos unverändert
- [ ] Schnelle Clicks auf verschiedene Todos → Alle korrekt verarbeitet
- [ ] Concurrent toggles → Kein Race-Condition

### Error Scenarios
- [ ] Backend nicht erreichbar → Rollback + Fehlermeldung
- [ ] 404 Todo nicht gefunden → Rollback + Todo aus Liste entfernen
- [ ] 500 Server Error → Rollback + Retry-Option

### Edge Cases
- [ ] Sehr schnelle Doppelklicks → Nur ein Toggle
- [ ] Toggle während Loading → Button disabled
- [ ] Network Timeout → Retry-Mechanismus

### Performance
- [ ] 100+ Todos toggle → Smooth ohne Lag
- [ ] Change Detection optimized → Nur betroffenes Todo re-rendert

## CSS-Anpassungen
```css
.todo-list li.completed label {
  color: #d9d9d9;
  text-decoration: line-through;
}

.todo-list li .toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Definition of Done
- [ ] Checkbox toggle funktioniert für alle Todos
- [ ] Optimistic updates mit Rollback implementiert
- [ ] Backend Integration über PUT /api/todos/{id}/toggle
- [ ] UI zeigt completed/active Status korrekt
- [ ] Error handling für alle Fehlerfälle
- [ ] Performance optimization (keine unnötigen re-renders)
- [ ] Unit Tests für Component und Service
- [ ] Integration Tests mit Backend
- [ ] Accessibility: Checkbox proper labeling

## Abhängigkeiten
- 05-display-todos.md (TodoItemComponent verfügbar)
- 02-todo-model.md (Backend PUT /api/todos/{id}/toggle)

## Nachfolgende Features
- 07-delete-todo.md (Todo löschen)
- 09-counter.md (Counter berücksichtigt completed Status)