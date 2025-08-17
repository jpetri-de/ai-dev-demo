# Feature 05: Todo-Liste anzeigen

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
- [ ] Efficient rendering mit `*ngFor` und `trackBy`
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

### TodoListComponent
```typescript
@Component({
  selector: 'app-todo-list',
  template: `
    <section class="main" *ngIf="todos.length > 0">
      <ul class="todo-list">
        <app-todo-item 
          *ngFor="let todo of todos; trackBy: trackByTodoId"
          [todo]="todo">
        </app-todo-item>
      </ul>
    </section>
  `
})
export class TodoListComponent implements OnInit {
  todos: Todo[] = [];
  
  constructor(private todoService: TodoService) {}
  
  ngOnInit(): void {
    this.loadTodos();
  }
  
  private loadTodos(): void {
    this.todoService.getTodos().subscribe(todos => {
      this.todos = todos;
    });
  }
  
  trackByTodoId(index: number, todo: Todo): number {
    return todo.id;
  }
}
```

### TodoItemComponent
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
          readonly
        >
        <label>{{ todo.title }}</label>
        <button class="destroy"></button>
      </div>
    </li>
  `
})
export class TodoItemComponent {
  @Input() todo!: Todo;
}
```

### TodoService Erweiterung
```typescript
@Injectable()
export class TodoService {
  private todos$ = new BehaviorSubject<Todo[]>([]);
  
  getTodos(): Observable<Todo[]> {
    this.http.get<Todo[]>(this.apiUrl).subscribe(todos => {
      this.todos$.next(todos);
    });
    return this.todos$.asObservable();
  }
  
  createTodo(title: string): Observable<Todo> {
    return this.http.post<Todo>(this.apiUrl, { title }).pipe(
      tap(newTodo => {
        const currentTodos = this.todos$.value;
        this.todos$.next([...currentTodos, newTodo]);
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