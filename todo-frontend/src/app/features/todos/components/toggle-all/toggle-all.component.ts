import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { TodoService } from '../../../../core/services/todo.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-toggle-all',
  template: `
    <input 
      id="toggle-all" 
      class="toggle-all" 
      type="checkbox"
      [checked]="allCompleted$ | async"
      [disabled]="isToggling"
      (change)="onToggleAll()"
      [attr.aria-label]="getToggleAriaLabel(allCompleted$ | async)"
    />
    <label for="toggle-all" 
           [class.loading]="isToggling">
      {{ isToggling ? 'Updating...' : 'Mark all as complete' }}
    </label>
  `,
  styleUrls: ['./toggle-all.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleAllComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observable streams for reactive UI
  allCompleted$ = this.todoService.allCompleted$;
  hasTodos$ = this.todoService.hasTodos$;
  activeCount$ = this.todoService.getActiveCount();
  
  isToggling = false;

  constructor(
    private todoService: TodoService,
    private errorService: ErrorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getToggleAriaLabel(allCompleted: boolean | null): string {
    return `Mark all as ${allCompleted ? 'incomplete' : 'complete'}`;
  }

  onToggleAll(): void {
    if (this.isToggling) {
      return;
    }

    // Determine target state based on active count
    this.activeCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(activeCount => {
        const shouldComplete = activeCount > 0;
        
        this.isToggling = true;
        this.cdr.markForCheck();

        this.todoService.toggleAllTodos(shouldComplete)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.isToggling = false;
              this.cdr.markForCheck();
            },
            error: (error) => {
              this.isToggling = false;
              console.error('Failed to toggle all todos:', error);
              this.errorService.handleError(error.message || 'Failed to toggle all todos');
              this.cdr.markForCheck();
            }
          });
      });
  }
}