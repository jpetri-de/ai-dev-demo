# Feature 08: Todo bearbeiten

## Ziel
Benutzer können Todo-Titel durch Doppelklick auf das Label bearbeiten.

## Beschreibung
Doppelklick auf ein Todo-Label aktiviert den Bearbeitungsmodus. Ein Eingabefeld erscheint mit dem aktuellen Titel. Enter oder Blur speichert, Escape bricht ab. Leerer Text löscht das Todo.

## Akzeptanzkriterien

### Edit-Modus Aktivierung
- [ ] Doppelklick auf Todo-Label aktiviert Bearbeitungsmodus
- [ ] Todo-Element bekommt CSS-Klasse `.editing`
- [ ] Eingabefeld wird angezeigt und fokussiert
- [ ] Eingabefeld enthält aktuellen Todo-Titel

### Speichern & Abbrechen
- [ ] Enter-Taste speichert Änderungen
- [ ] Blur (Klick außerhalb) speichert Änderungen
- [ ] Escape-Taste bricht Bearbeitung ab (ohne Speichern)
- [ ] Leerer Text (nach trim) löscht das Todo

### Validierung
- [ ] Input wird mit `.trim()` bereinigt
- [ ] Maximale Länge: 500 Zeichen
- [ ] Nur Leerzeichen werden als leer behandelt

### Backend-Integration
- [ ] Änderungen via `PUT /api/todos/{id}` gespeichert
- [ ] Optimistic Updates mit Rollback bei Fehlern
- [ ] Löschung via `DELETE /api/todos/{id}` bei leerem Text

## Technische Spezifikationen

### TodoItemComponent Update
```typescript
@Component({
  selector: 'app-todo-item',
  template: `
    <li [class.completed]="todo.completed" 
        [class.editing]="isEditing"
        [class.deleting]="isDeleting">
      <div class="view" *ngIf="!isEditing">
        <input 
          class="toggle" 
          type="checkbox" 
          [checked]="todo.completed"
          (click)="toggleTodo()"
          [disabled]="isToggling || isDeleting"
        >
        <label (dblclick)="startEditing()">{{ todo.title }}</label>
        <button 
          class="destroy"
          (click)="deleteTodo()"
          [disabled]="isDeleting"
        ></button>
      </div>
      
      <input 
        *ngIf="isEditing"
        class="edit"
        [value]="editText"
        (input)="editText = $event.target.value"
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
  `]
})
export class TodoItemComponent implements AfterViewInit {
  @Input() todo!: Todo;
  @Output() todoDeleted = new EventEmitter<number>();
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
  
  startEditing(): void {
    if (this.isDeleting || this.isSaving) return;
    
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
      // Show validation error
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
      },
      error: (error) => {
        // Rollback
        this.todo.title = originalTitle;
        this.isEditing = true;
        this.editText = this.originalTitle;
        this.isSaving = false;
        // Show error message
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

### TodoService Erweiterung
```typescript
@Injectable()
export class TodoService {
  
  updateTodo(id: number, title: string): Observable<Todo> {
    return this.http.put<Todo>(`${this.apiUrl}/${id}`, { title }).pipe(
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

### Backend Update Endpoint
```java
@PutMapping("/{id}")
public ResponseEntity<Todo> updateTodo(@PathVariable Long id, @RequestBody UpdateTodoRequest request) {
    Todo todo = todoStorage.findById(id);
    if (todo == null) {
        return ResponseEntity.notFound().build();
    }
    
    String title = request.getTitle().trim();
    if (title.isEmpty() || title.length() > 500) {
        return ResponseEntity.badRequest().build();
    }
    
    todo.setTitle(title);
    todoStorage.update(todo);
    
    return ResponseEntity.ok(todo);
}
```

## Testfälle

### Happy Flow
- [ ] Doppelklick auf Label → Edit-Modus aktiviert
- [ ] Eingabefeld ist fokussiert und enthält aktuellen Titel
- [ ] Text ändern + Enter → Todo wird gespeichert
- [ ] Text ändern + Blur → Todo wird gespeichert

### Edit-Modus Verhalten
- [ ] Editing CSS-Klasse wird gesetzt
- [ ] View wird versteckt, Edit-Input wird angezeigt
- [ ] Input ist selektiert für einfaches Überschreiben
- [ ] Escape → Änderungen verworfen, Edit-Modus verlassen

### Validierung & Edge Cases
- [ ] Leerer Text + Enter → Todo wird gelöscht
- [ ] Nur Leerzeichen "   " + Enter → Todo wird gelöscht
- [ ] Unveränderten Text + Enter → Edit-Modus verlassen (kein API-Call)
- [ ] 501 Zeichen → Validierungsfehler, Edit-Modus bleibt aktiv

### Backend-Integration
- [ ] Text geändert → PUT Request mit neuem Titel
- [ ] Backend Success → Todo aktualisiert, Edit-Modus verlassen
- [ ] Backend Error → Rollback, Edit-Modus wieder aktiv

### Concurrent Operations
- [ ] Edit während Toggle → Toggle disabled
- [ ] Edit während Delete → Edit abgebrochen
- [ ] Schneller Doppelklick → Nur ein Edit-Modus

### Multiple Edits
- [ ] Todo 1 bearbeiten → Andere Todos unverändert
- [ ] Todo speichern + sofort anderes Todo bearbeiten
- [ ] Gleichzeitige Edits → Serialisierung

### Keyboard Navigation
- [ ] Tab aus Edit-Input → Speichern (blur)
- [ ] Shift+Tab in Edit-Input → Speichern (blur)
- [ ] Enter in Edit-Input → Speichern
- [ ] Escape in Edit-Input → Abbrechen

## CSS-Anpassungen
```css
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
  box-shadow: inset 0 -1px 5px 0 rgba(0, 0, 0, 0.2);
}
```

## Definition of Done
- [ ] Doppelklick aktiviert Edit-Modus mit fokussiertem Input
- [ ] Enter und Blur speichern Änderungen
- [ ] Escape bricht Bearbeitung ab
- [ ] Leerer Text löscht das Todo
- [ ] Backend Integration über PUT /api/todos/{id}
- [ ] Optimistic Updates mit Rollback
- [ ] Input-Validierung (Länge, Leerzeichen)
- [ ] Error handling für alle Szenarien
- [ ] Keyboard Navigation accessibility
- [ ] Unit Tests für Component und Service
- [ ] Integration Tests mit Backend

## Abhängigkeiten
- 07-delete-todo.md (Löschen-Funktionalität für leeren Text)
- 06-toggle-todo.md (TodoItemComponent mit Toggle)
- 02-todo-model.md (Backend PUT /api/todos/{id})

## Nachfolgende Features
- 09-counter.md (Counter für Todo-Statistiken)
- 10-filter-todos.md (Filter-Funktionalität)