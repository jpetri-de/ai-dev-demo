import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TodoService } from '../../../../core/services/todo.service';
import { ErrorService } from '../../../../core/services/error.service';
import { Todo, TodoFilter } from '../../models/todo.interface';

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
  error$ = this.errorService.error$;
  currentFilter: TodoFilter = { type: 'all', label: 'All' };
  
  constructor(
    private todoService: TodoService,
    private errorService: ErrorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTodos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        }
      });
  }

  onCreateTodo(title: string): void {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
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
        this.todoService.toggleAllTodos(shouldComplete)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.cdr.markForCheck();
            },
            error: (error) => {
              console.error('Failed to toggle all todos:', error);
            }
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
        }
      });
  }

  onUpdateTodo(data: { id: number; title: string }): void {
    this.todoService.updateTodo(data.id, { title: data.title })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Failed to update todo:', error);
        }
      });
  }

  clearError(): void {
    this.errorService.clearError();
  }
}