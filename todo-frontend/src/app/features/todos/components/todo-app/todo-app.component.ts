import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, map, distinctUntilChanged, delay } from 'rxjs/operators';
import { TodoService } from '../../../../core/services/todo.service';
import { ErrorService } from '../../../../core/services/error.service';
import { UIStateService } from '../../../../core/services/ui-state.service';
import { PopupService } from '../../../../shared/services/popup.service';
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
  currentFilter$ = this.todoService.getCurrentFilter();
  
  // Filtered todos based on current route/filter
  filteredTodos$ = this.todoService.getCurrentlyFilteredTodos();
  
  isCreating = false;
  
  // Simple popup state for testing
  showFilterPopup = false;
  popupMessage = '';
  popupTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private todoService: TodoService,
    private errorService: ErrorService,
    private uiStateService: UIStateService,
    private popupService: PopupService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('TodoAppComponent: ngOnInit called');
    this.loadTodos();
    this.initializeFilterFromRoute();
    this.setupUIStateManagement();
    this.setupFilterPopups(); // simple version for testing
    
    // Debug filtered todos
    this.filteredTodos$.pipe(takeUntil(this.destroy$)).subscribe(todos => {
      console.log('TodoAppComponent: Filtered todos updated:', todos.map(t => `${t.title} (${t.completed ? 'completed' : 'active'})`));
    });
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
      let newFilter: 'all' | 'active' | 'completed' = 'all';
      
      console.log('TodoAppComponent - Route segments:', segments.map(s => s.path));
      console.log('TodoAppComponent - Full URL:', window.location.pathname);
      
      // Check the actual URL path instead of route segments
      const path = window.location.pathname;
      console.log('TodoAppComponent - Window path:', path);
      
      if (path === '/active') {
        newFilter = 'active';
      } else if (path === '/completed') {
        newFilter = 'completed';
      } else {
        newFilter = 'all';
      }
      
      console.log('TodoAppComponent - Setting filter to:', newFilter);
      this.todoService.setCurrentFilter(newFilter);
      this.cdr.markForCheck();
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

  private setupFilterPopups(): void {
    // Simple popup when filter changes
    combineLatest([
      this.currentFilter$,
      this.todos$
    ]).pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged(([prevFilter], [currFilter]) => prevFilter === currFilter),
      delay(300) // Small delay to ensure counts are accurate
    ).subscribe(([currentFilter, allTodos]) => {
      console.log('Filter popup trigger:', { currentFilter, totalCount: allTodos.length });
      
      // Don't show popup on initial load or if no todos
      if (allTodos.length === 0) return;
      
      // Calculate counts based on filter type
      let displayCount = 0;
      let filterLabel = '';
      
      switch (currentFilter) {
        case 'active':
          displayCount = allTodos.filter(todo => !todo.completed).length;
          filterLabel = 'active';
          break;
        case 'completed':
          displayCount = allTodos.filter(todo => todo.completed).length;
          filterLabel = 'completed';
          break;
        case 'all':
        default:
          displayCount = allTodos.length;
          filterLabel = 'total';
          break;
      }
      
      // Show simple popup
      this.showSimplePopup(`Showing ${displayCount} ${filterLabel} todo${displayCount !== 1 ? 's' : ''}`);
    });
  }

  private showSimplePopup(message: string): void {
    this.popupMessage = message;
    this.showFilterPopup = true;
    this.cdr.markForCheck();
    
    // Auto-hide after 2.5 seconds
    if (this.popupTimer) {
      clearTimeout(this.popupTimer);
    }
    
    this.popupTimer = setTimeout(() => {
      this.showFilterPopup = false;
      this.cdr.markForCheck();
    }, 2500);
  }

  hidePopup(): void {
    this.showFilterPopup = false;
    if (this.popupTimer) {
      clearTimeout(this.popupTimer);
    }
    this.cdr.markForCheck();
  }
}