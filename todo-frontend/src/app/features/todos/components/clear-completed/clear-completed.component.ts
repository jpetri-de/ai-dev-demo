import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { TodoService } from '../../../../core/services/todo.service';

@Component({
  selector: 'app-clear-completed',
  template: `
    <button 
      class="clear-completed"
      *ngIf="(stats$ | async)?.completed! > 0"
      (click)="onClearCompleted()"
      [disabled]="isLoading"
      [attr.aria-label]="'Clear ' + (stats$ | async)?.completed + ' completed todo' + ((stats$ | async)?.completed === 1 ? '' : 's')">
      Clear completed
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClearCompletedComponent {
  @Output() clearCompleted = new EventEmitter<void>();
  
  stats$ = this.todoService.getStats();
  isLoading = false;
  
  constructor(private todoService: TodoService) {}
  
  onClearCompleted(): void {
    this.clearCompleted.emit();
  }
}