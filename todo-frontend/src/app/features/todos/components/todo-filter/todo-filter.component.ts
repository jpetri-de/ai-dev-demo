import { Component, ChangeDetectionStrategy, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { TodoService } from '../../../../core/services/todo.service';

export interface FilterOption {
  type: 'all' | 'active' | 'completed';
  label: string;
  route: string;
}

@Component({
  selector: 'app-todo-filter',
  template: `
    <ul class="filters">
      <li *ngFor="let filter of filterOptions">
        <a 
          href="#"
          (click)="onFilterClick(filter.type, $event)"
          [class.selected]="(currentFilter$ | async) === filter.type"
          [attr.aria-label]="'Show ' + filter.label.toLowerCase() + ' todos'"
          [attr.aria-current]="(currentFilter$ | async) === filter.type ? 'page' : null">
          {{ filter.label }}
        </a>
      </li>
    </ul>
  `,
  styleUrls: ['./todo-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoFilterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentFilter$ = this.todoService.getCurrentFilter();
  
  filterOptions: FilterOption[] = [
    { type: 'all', label: 'All', route: '/' },
    { type: 'active', label: 'Active', route: '/active' },
    { type: 'completed', label: 'Completed', route: '/completed' }
  ];

  constructor(
    private todoService: TodoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Route handling is now done by TodoAppComponent
    // This component only displays the current filter state
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilterClick(filterType: 'all' | 'active' | 'completed', event: Event): void {
    event.preventDefault();
    console.log('Filter clicked:', filterType);
    
    // Navigate to the appropriate route
    const route = filterType === 'all' ? '/' : `/${filterType}`;
    console.log('Navigating to:', route);
    this.router.navigate([route]);
  }
}