import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { TodoFilter } from '../../models/todo.interface';

@Component({
  selector: 'app-todo-filter',
  templateUrl: './todo-filter.component.html',
  styleUrls: ['./todo-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoFilterComponent {
  @Input() currentFilter!: TodoFilter;
  @Output() filterChange = new EventEmitter<TodoFilter>();

  filters: TodoFilter[] = [
    { type: 'all', label: 'All' },
    { type: 'active', label: 'Active' },
    { type: 'completed', label: 'Completed' }
  ];

  onFilterSelect(filter: TodoFilter): void {
    this.filterChange.emit(filter);
  }

  isFilterSelected(filter: TodoFilter): boolean {
    return this.currentFilter.type === filter.type;
  }
}