import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { TodoService } from '../../../../core/services/todo.service';
import { ErrorService } from '../../../../core/services/error.service';
import { UIStateService } from '../../../../core/services/ui-state.service';
import { TodoValidator } from '../../models/todo-validation';

@Component({
  selector: 'app-todo-app',
  templateUrl: './todo-app.component.html',
  styleUrls: ['./todo-app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoAppComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('newTodoInput', { static: true }) newTodoInput!: ElementRef<HTMLInputElement>;
  
  private destroy$ = new Subject<void>();
  
  // Enhanced reactive streams using the new TodoService features
  todos$ = this.todoService.todos$;
  hasTodos$ = this.todoService.hasTodos$;
  activeCount$ = this.todoService.getActiveCount();
  stats$ = this.todoService.getStats();
  loading$ = this.todoService.loading$;
  error$ = this.errorService.error$;
  
  // UI state management
  showMain$ = this.uiStateService.showMain$;
  showFooter$ = this.uiStateService.showFooter$;
  currentFilter$ = this.uiStateService.currentFilter$;
  
  // Filtered todos based on current route/filter
  filteredTodos$ = combineLatest([
    this.todos$,
    this.currentFilter$
  ]).pipe(
    map(([todos, filter]) => {
      switch (filter) {
        case 'active':
          return todos.filter(todo => !todo.completed);
        case 'completed':
          return todos.filter(todo => todo.completed);
        default:
          return todos;
      }
    })
  );
  
  isCreating = false;

  constructor(
    private todoService: TodoService,
    private errorService: ErrorService,
    private uiStateService: UIStateService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadTodos();
    this.initializeFilterFromRoute();
    this.setupUIStateManagement();
  }

  ngAfterViewInit(): void {
    // Setup auto-focus and keyboard navigation per TodoMVC specification
    this.uiStateService.setupKeyboardNavigation(this.newTodoInput);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupUIStateManagement(): void {
    // Automatically update UI visibility based on todos count
    this.hasTodos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(hasTodos => {
        this.uiStateService.updateVisibility(hasTodos);
      });
  }

  private initializeFilterFromRoute(): void {
    // Get initial filter from route
    this.route.url.pipe(takeUntil(this.destroy$)).subscribe(segments => {
      if (segments.length > 0) {
        const path = segments[0].path;
        switch (path) {
          case 'active':
            this.uiStateService.setCurrentFilter('active');
            break;
          case 'completed':
            this.uiStateService.setCurrentFilter('completed');
            break;
          default:
            this.uiStateService.setCurrentFilter('all');
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
      this.uiStateService.focusNewTodoInput(this.newTodoInput);
      return;
    }

    if (trimmedTitle.length > TodoValidator.MAX_TITLE_LENGTH) {
      this.errorService.handleError(`Todo title cannot exceed ${TodoValidator.MAX_TITLE_LENGTH} characters`);
      this.uiStateService.focusNewTodoInput(this.newTodoInput);
      return;
    }

    this.isCreating = true;
    this.uiStateService.setLoading(true);

    this.todoService.createTodo(trimmedTitle)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isCreating = false;
          this.uiStateService.setLoading(false);
          
          // Clear input and return focus per specification
          if (this.newTodoInput?.nativeElement) {
            this.newTodoInput.nativeElement.value = '';
          }
          this.uiStateService.focusNewTodoInput(this.newTodoInput);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isCreating = false;
          this.uiStateService.setLoading(false);
          console.error('Failed to create todo:', error);
          this.errorService.handleError(error.message || 'Failed to create todo');
          this.uiStateService.focusNewTodoInput(this.newTodoInput);
          this.cdr.markForCheck();
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
          // Return focus to main input after deletion
          this.uiStateService.focusNewTodoInput(this.newTodoInput);
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
    
    // Handle empty title deletion workflow per specification
    if (!trimmedTitle) {
      this.onDeleteTodo(data.id);
      return;
    }

    if (trimmedTitle.length > TodoValidator.MAX_TITLE_LENGTH) {
      this.errorService.handleError(`Todo title cannot exceed ${TodoValidator.MAX_TITLE_LENGTH} characters`);
      return;
    }

    this.todoService.updateTodo(data.id, trimmedTitle)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Return focus to main input after editing
          this.uiStateService.focusNewTodoInput(this.newTodoInput);
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