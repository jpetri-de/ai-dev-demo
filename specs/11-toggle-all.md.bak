# Feature 11: Alle als erledigt markieren

## Ziel
"Toggle All" Checkbox zum gleichzeitigen Umschalten aller Todos zwischen completed/active Status.

## Beschreibung
Eine Checkbox oberhalb der Todo-Liste schaltet alle Todos gleichzeitig um. Wenn alle Todos completed sind, ist sie angehakt. Wenn mindestens ein Todo aktiv ist, ist sie nicht angehakt. Nach "Clear Completed" wird sie zurückgesetzt.

## Akzeptanzkriterien

### Toggle-All Checkbox
- [ ] Checkbox oberhalb der Todo-Liste (chevron-down Icon)
- [ ] Klick schaltet alle Todos in denselben Zustand um
- [ ] Checked wenn alle Todos completed sind
- [ ] Unchecked wenn mindestens ein Todo aktiv ist

### Synchronisation
- [ ] Automatische Aktualisierung bei einzelnen Todo-Toggles
- [ ] Zurücksetzung nach "Clear Completed"
- [ ] Versteckt wenn keine Todos vorhanden

### Bulk-Operation Verhalten
- [ ] Alle aktiv + Toggle → Alle werden completed
- [ ] Alle completed + Toggle → Alle werden aktiv
- [ ] Gemischt + Toggle → Alle werden completed (Priorität auf "alle erledigen")

## Technische Spezifikationen

### ToggleAllComponent
```typescript
@Component({
  selector: 'app-toggle-all',
  template: `
    <input 
      id="toggle-all" 
      class="toggle-all" 
      type="checkbox"
      [checked]="allCompleted"
      [disabled]="isToggling"
      (change)="toggleAll()"
    >
    <label for="toggle-all">Mark all as complete</label>
  `
})
export class ToggleAllComponent implements OnInit, OnDestroy {
  allCompleted = false;
  isToggling = false;
  private subscription = new Subscription();
  
  constructor(private todoService: TodoService) {}
  
  ngOnInit(): void {
    this.subscription.add(
      this.todoService.getTodos().subscribe(todos => {
        if (todos.length === 0) {
          this.allCompleted = false;
        } else {
          this.allCompleted = todos.every(todo => todo.completed);
        }
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  toggleAll(): void {
    if (this.isToggling) return;
    
    this.isToggling = true;
    const targetState = !this.allCompleted;
    
    this.todoService.toggleAllTodos(targetState).subscribe({
      next: () => {
        this.isToggling = false;
      },
      error: (error) => {
        this.isToggling = false;
        // Show error message
      }
    });
  }
}
```

### TodoService Bulk Operations
```typescript
@Injectable()
export class TodoService {
  
  toggleAllTodos(completed: boolean): Observable<Todo[]> {
    const todos = this.todos$.value;
    const todosToUpdate = todos.filter(todo => todo.completed !== completed);
    
    if (todosToUpdate.length === 0) {
      return of(todos); // Nothing to update
    }
    
    // Optimistic update
    const updatedTodos = todos.map(todo => ({
      ...todo,
      completed
    }));
    this.todos$.next(updatedTodos);
    
    // Batch update to backend
    const updateRequests = todosToUpdate.map(todo => 
      this.http.put<Todo>(`${this.apiUrl}/${todo.id}`, { 
        ...todo, 
        completed 
      })
    );
    
    return forkJoin(updateRequests).pipe(
      map(() => updatedTodos),
      catchError(error => {
        // Rollback optimistic update
        this.todos$.next(todos);
        throw error;
      })
    );
  }
  
  // Alternative: Backend bulk endpoint
  toggleAllTodosBulk(completed: boolean): Observable<Todo[]> {
    const todos = this.todos$.value;
    
    // Optimistic update
    const updatedTodos = todos.map(todo => ({
      ...todo,
      completed
    }));
    this.todos$.next(updatedTodos);
    
    return this.http.put<Todo[]>(`${this.apiUrl}/toggle-all`, { completed }).pipe(
      tap(backendTodos => {
        this.todos$.next(backendTodos);
      }),
      catchError(error => {
        // Rollback
        this.todos$.next(todos);
        throw error;
      })
    );
  }
}
```

### Backend Bulk Endpoint (Optional)
```java
@PutMapping("/toggle-all")
public ResponseEntity<List<Todo>> toggleAllTodos(@RequestBody ToggleAllRequest request) {
    List<Todo> todos = todoStorage.findAll();
    
    todos.forEach(todo -> {
        todo.setCompleted(request.isCompleted());
        todoStorage.update(todo);
    });
    
    return ResponseEntity.ok(todos);
}

public class ToggleAllRequest {
    private boolean completed;
    
    // Getter, Setter
}
```

### TodoAppComponent Integration
```typescript
@Component({
  selector: 'app-todo',
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
        >
      </header>
      
      <section class="main" *ngIf="hasTodos">
        <app-toggle-all></app-toggle-all>
        <app-todo-list></app-todo-list>
      </section>
      
      <footer class="footer" *ngIf="hasTodos">
        <app-todo-counter></app-todo-counter>
        <app-todo-filter></app-todo-filter>
      </footer>
    </section>
  `
})
export class TodoAppComponent {
  // Existing implementation
}
```

## Testfälle

### Toggle-All Logic
- [ ] Alle Todos aktiv → Toggle → Alle werden completed
- [ ] Alle Todos completed → Toggle → Alle werden aktiv  
- [ ] 2 aktiv, 1 completed → Toggle → Alle werden completed
- [ ] Leere Liste → Toggle-All nicht sichtbar

### Checkbox State
- [ ] Alle completed → Checkbox checked
- [ ] Mind. 1 aktiv → Checkbox unchecked
- [ ] Neues aktives Todo → Checkbox wird unchecked
- [ ] Letztes aktives Todo completed → Checkbox wird checked

### Backend Integration
- [ ] Toggle All → Bulk-Request an Backend
- [ ] Backend Success → Alle Todos aktualisiert
- [ ] Backend Error → Rollback der optimistischen Updates
- [ ] Partial Failure → Konsistenter Zustand

### Performance
- [ ] 100+ Todos toggle → Performant ohne UI-Freeze
- [ ] Optimistic Updates → Sofortige UI-Reaktion
- [ ] Batch-Requests → Efficient Network usage

### Edge Cases
- [ ] Toggle während einzelner Todo-Update → Serialisierung
- [ ] Schnelle Doppelklicks → Nur ein Batch-Request
- [ ] Toggle während "Clear Completed" → Operation queue

### Integration mit anderen Features
- [ ] Toggle All → Counter wird korrekt aktualisiert
- [ ] Toggle All → Filter zeigt korrekte Todos
- [ ] Clear Completed → Toggle-All wird zurückgesetzt

## CSS-Styling (aus main.css)
```css
.toggle-all {
  width: 1px;
  height: 1px;
  border: none; /* Mobile Safari */
  opacity: 0;
  position: absolute;
  right: 100%;
  bottom: 100%;
}

.toggle-all + label {
  width: 60px;
  height: 34px;
  font-size: 0;
  position: absolute;
  top: -52px;
  left: -13px;
  transform: rotate(90deg);
}

.toggle-all + label:before {
  content: '❯';
  font-size: 22px;
  color: #e6e6e6;
  padding: 10px 27px 10px 27px;
}

.toggle-all:checked + label:before {
  color: #737373;
}
```

## Advanced Implementation

### Optimized Batch Updates
```typescript
// Use RxJS operators for better performance
toggleAllTodos(completed: boolean): Observable<Todo[]> {
  const todos = this.todos$.value;
  const todosToUpdate = todos.filter(todo => todo.completed !== completed);
  
  return from(todosToUpdate).pipe(
    mergeMap(todo => 
      this.http.put<Todo>(`${this.apiUrl}/${todo.id}`, { 
        ...todo, 
        completed 
      }),
      // Limit concurrent requests
      3
    ),
    toArray(),
    map(() => todos.map(todo => ({ ...todo, completed })))
  );
}
```

### Progress Indication
```typescript
toggleAll(): void {
  this.isToggling = true;
  this.toggleProgress = 0;
  
  const targetState = !this.allCompleted;
  
  this.todoService.toggleAllTodos(targetState).pipe(
    // Track progress
    scan((progress, _) => progress + 1, 0),
    tap(progress => this.toggleProgress = progress)
  ).subscribe({
    complete: () => {
      this.isToggling = false;
      this.toggleProgress = 0;
    }
  });
}
```

## Definition of Done
- [ ] Toggle-All Checkbox funktioniert für alle Szenarien
- [ ] Checkbox-State synchronisiert mit Todo-Status
- [ ] Bulk-Update optimiert (Batch-Requests oder Bulk-Endpoint)
- [ ] Optimistic Updates mit Rollback-Mechanismus
- [ ] Integration mit Counter und Filter
- [ ] Performance getestet mit vielen Todos
- [ ] Error handling für Bulk-Operationen
- [ ] Unit Tests für Toggle-All Logic
- [ ] Integration Tests mit Backend
- [ ] Accessibility: Proper labeling

## Abhängigkeiten
- 09-counter.md (Counter reagiert auf bulk toggles)
- 10-filter-todos.md (Filter zeigt korrekte Todos nach toggle)
- 06-toggle-todo.md (Einzelne Toggles beeinflussen Toggle-All State)
- 02-todo-model.md (Backend Support für Bulk-Updates)

## Nachfolgende Features
- 12-clear-completed.md (Clear Completed resettet Toggle-All)
- 13-ui-states.md (UI States Management)