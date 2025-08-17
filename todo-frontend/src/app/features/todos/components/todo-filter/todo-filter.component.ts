import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TodoFilter } from '../../models/todo.interface';

@Component({
  selector: 'app-todo-filter',
  templateUrl: './todo-filter.component.html',
  styleUrls: ['./todo-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoFilterComponent implements OnInit {
  @Input() currentFilter!: TodoFilter;
  @Output() filterChange = new EventEmitter<TodoFilter>();

  filters: TodoFilter[] = [
    { type: 'all', label: 'All' },
    { type: 'active', label: 'Active' },
    { type: 'completed', label: 'Completed' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Listen to route changes and update filter
    this.route.url.subscribe(segments => {
      if (segments.length > 0) {
        const path = segments[0].path;
        const filter = this.filters.find(f => f.type === path) || this.filters[0];
        if (filter.type !== this.currentFilter?.type) {
          this.filterChange.emit(filter);
        }
      }
    });
  }

  onFilterSelect(filter: TodoFilter, event: Event): void {
    event.preventDefault();
    
    // Navigate to the filter route
    this.router.navigate([`/${filter.type}`]);
    
    // Emit the filter change
    this.filterChange.emit(filter);
  }

  isFilterSelected(filter: TodoFilter): boolean {
    return this.currentFilter?.type === filter.type;
  }

  getFilterRoute(filter: TodoFilter): string {
    return `/${filter.type}`;
  }
}