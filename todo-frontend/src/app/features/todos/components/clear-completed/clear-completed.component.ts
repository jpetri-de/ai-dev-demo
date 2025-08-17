import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { TodoService } from '../../../../core/services/todo.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-clear-completed',
  template: `
    <button 
      class="clear-completed"
      *ngIf="hasCompleted$ | async"
      (click)="onClearCompleted()"
      [disabled]="isClearing"
      [class.loading]="isClearing"
      [attr.aria-label]="buttonAriaLabel$ | async">
      <span *ngIf="!isClearing">Clear completed</span>
      <span *ngIf="isClearing" class="loading-text">
        <span class="spinner"></span>
        Clearing...
      </span>
    </button>
  `,
  styleUrls: ['./clear-completed.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClearCompletedComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Enhanced observable streams for reactive UI
  hasCompleted$ = this.todoService.hasCompleted$;
  completedCount$ = this.todoService.getCompletedCount();
  
  // Dynamic aria-label for accessibility
  buttonAriaLabel$ = this.completedCount$.pipe(
    takeUntil(this.destroy$),
    map(count => `Clear ${count} completed todo${count === 1 ? '' : 's'}`)
  );
  
  isClearing = false;

  constructor(
    private todoService: TodoService,
    private errorService: ErrorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClearCompleted(): void {
    if (this.isClearing) {
      return;
    }

    // Show confirmation for better UX
    this.completedCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        if (count === 0) {
          return;
        }

        // Optional: Add confirmation dialog for large numbers
        if (count > 10) {
          const confirmed = window.confirm(
            `Are you sure you want to delete ${count} completed todos? This action cannot be undone.`
          );
          if (!confirmed) {
            return;
          }
        }

        this.performClearCompleted();
      });
  }

  private performClearCompleted(): void {
    this.isClearing = true;
    this.cdr.markForCheck();

    this.todoService.clearCompleted()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isClearing = false;
          this.cdr.markForCheck();
          
          // Optional: Show success feedback
          // this.showSuccessMessage();
        },
        error: (error) => {
          this.isClearing = false;
          console.error('Failed to clear completed todos:', error);
          this.errorService.handleError(error.message || 'Failed to clear completed todos');
          this.cdr.markForCheck();
        }
      });
  }

  // Optional: Success feedback method
  private showSuccessMessage(): void {
    // Could integrate with a toast service or temporary message
    console.log('Completed todos cleared successfully');
  }
}