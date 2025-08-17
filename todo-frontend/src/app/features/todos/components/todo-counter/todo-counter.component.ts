import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TodoService } from '../../../../core/services/todo.service';

@Component({
  selector: 'app-todo-counter',
  template: `
    <span class="todo-count">
      <strong>{{ (stats$ | async)?.active || 0 }}</strong>
      {{ (stats$ | async)?.active === 1 ? 'item' : 'items' }} left
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoCounterComponent {
  stats$ = this.todoService.getStats();
  
  constructor(private todoService: TodoService) {}
}