import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TodoService } from '../../../../core/services/todo.service';
import { ErrorService } from '../../../../core/services/error.service';
import { Todo, TodoFilter } from '../../models/todo.interface';
import { TodoValidator } from '../../models/todo-validation';

@Component({
  selector: 'app-todo-app',
  templateUrl: './todo-app.component.html',
  styleUrls: ['./todo-app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoAppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  todos$ = this.todoService.todos$;
  stats$ = this.todoService.getStats();
  loading$ = this.todoService.loading$;
  error$ = this.errorService.error$;
  currentFilter: TodoFilter = { type: 'all', label: 'All' };
  
  constructor(
    private todoService: TodoService,
    private errorService: ErrorService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadTodos();
    this.initializeFilterFromRoute();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFilterFromRoute(): void {
    // Get initial filter from route
    this.route.url.pipe(takeUntil(this.destroy$)).subscribe(segments => {
      if (segments.length > 0) {
        const path = segments[0].path;
        switch (path) {
          case 'active':
            this.currentFilter = { type: 'active', label: 'Active' };
            break;
          case 'completed':
            this.currentFilter = { type: 'completed', label: 'Completed' };
            break;
          default:
            this.currentFilter = { type: 'all', label: 'All' };
        }
        this.cdr.markForCheck();
      }
    });
  }

  private loadTodos(): void {
    this.todoService.getTodos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load todos:', error);
          this.errorService.handleError(error.message || 'Failed to load todos');
        }
      });
  }

  onCreateTodo(title: string): void {
    const trimmedTitle = title.trim();
    
    // Client-side validation with user feedback
    if (!trimmedTitle) {
      this.errorService.handleError('Todo title cannot be empty');
      return;
    }

    if (trimmedTitle.length > TodoValidator.MAX_TITLE_LENGTH) {
      this.errorService.handleError(`Todo title cannot exceed ${TodoValidator.MAX_TITLE_LENGTH} characters`);
      return;
    }

    this.todoService.createTodo(trimmedTitle)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to create todo:', error);
          this.errorService.handleError(error.message || 'Failed to create todo');
        }
      });
  }

  onFilterChange(filter: TodoFilter): void {
    this.currentFilter = filter;
    this.cdr.markForCheck();
  }

  onToggleAll(): void {
    this.stats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        const shouldComplete = stats.active > 0;
        
        // Get current todos and filter those that need to be toggled
        this.todos$
          .pipe(takeUntil(this.destroy$))
          .subscribe(todos => {
            const todosToToggle = todos.filter(todo => todo.completed !== shouldComplete);
            
            if (todosToToggle.length === 0) {
              return;
            }

            // Execute individual toggle operations in parallel
            const toggleOperations = todosToToggle.map(todo => 
              this.todoService.toggleTodo(todo.id)
            );

            forkJoin(toggleOperations)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => {
                  this.cdr.markForCheck();
                },
                error: (error) => {
                  console.error('Failed to toggle all todos:', error);
                  this.errorService.handleError('Failed to toggle all todos');
                }
              });
          });
      });
  }

  onClearCompleted(): void {
    this.todoService.clearCompleted()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to clear completed todos:', error);
          this.errorService.handleError(error.message || 'Failed to clear completed todos');
        }
      });
  }

  onToggleTodo(id: number): void {
    this.todoService.toggleTodo(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to toggle todo:', error);
          this.errorService.handleError(error.message || 'Failed to toggle todo');
        }
      });
  }

  onDeleteTodo(id: number): void {
    this.todoService.deleteTodo(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to delete todo:', error);
          this.errorService.handleError(error.message || 'Failed to delete todo');
        }
      });
  }

  onUpdateTodo(data: { id: number; title: string }): void {
    const trimmedTitle = data.title.trim();
    
    // Client-side validation
    if (!trimmedTitle) {
      this.errorService.handleError('Todo title cannot be empty');
      return;
    }

    if (trimmedTitle.length > TodoValidator.MAX_TITLE_LENGTH) {
      this.errorService.handleError(`Todo title cannot exceed ${TodoValidator.MAX_TITLE_LENGTH} characters`);
      return;
    }

    this.todoService.updateTodo(data.id, { title: trimmedTitle })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to update todo:', error);
          this.errorService.handleError(error.message || 'Failed to update todo');
        }
      });
  }

  clearError(): void {
    this.errorService.clearError();
  }
}