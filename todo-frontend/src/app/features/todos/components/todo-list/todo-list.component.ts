import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Todo, TodoFilter } from '../../models/todo.interface';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoListComponent {
  @Input() todos: Todo[] | null = [];
  @Input() filter: TodoFilter = { type: 'all', label: 'All' };
  
  @Output() toggleTodo = new EventEmitter<number>();
  @Output() deleteTodo = new EventEmitter<number>();
  @Output() updateTodo = new EventEmitter<{ id: number; title: string }>();

  get filteredTodos(): Todo[] {
    if (!this.todos) {
      return [];
    }
    
    switch (this.filter.type) {
      case 'active':
        return this.todos.filter(todo => !todo.completed);
      case 'completed':
        return this.todos.filter(todo => todo.completed);
      default:
        return this.todos;
    }
  }

  trackByTodo(index: number, todo: Todo): number {
    return todo.id || index;
  }

  onToggleTodo(id: number): void {
    this.toggleTodo.emit(id);
  }

  onDeleteTodo(id: number): void {
    this.deleteTodo.emit(id);
  }

  onUpdateTodo(data: { id: number; title: string }): void {
    this.updateTodo.emit(data);
  }
}