import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { TodoService } from '../../../../core/services/todo.service';

@Component({
  selector: 'app-todo-counter',
  template: `
    <span class="todo-count" *ngIf="counterText$ | async as text" 
          [attr.aria-label]="text">
      <strong>{{ activeCount$ | async }}</strong>
      {{ counterText$ | async }}
    </span>
  `,
  styleUrls: ['./todo-counter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoCounterComponent {
  // Use the enhanced activeCount$ observable for reactive updates
  activeCount$ = this.todoService.getActiveCount();
  
  // Reactive counter text with proper pluralization
  counterText$: Observable<string> = this.activeCount$.pipe(
    map(count => count === 1 ? 'item left' : 'items left')
  );

  constructor(private todoService: TodoService) {}
}