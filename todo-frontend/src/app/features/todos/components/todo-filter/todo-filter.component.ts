import { Component, ChangeDetectionStrategy, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
          [routerLink]="filter.route"
          [class.selected]="currentFilter === filter.type"
          [attr.aria-label]="'Show ' + filter.label.toLowerCase() + ' todos'"
          [attr.aria-current]="currentFilter === filter.type ? 'page' : null">
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
  
  currentFilter: 'all' | 'active' | 'completed' = 'all';
  
  filterOptions: FilterOption[] = [
    { type: 'all', label: 'All', route: '/' },
    { type: 'active', label: 'Active', route: '/active' },
    { type: 'completed', label: 'Completed', route: '/completed' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private todoService: TodoService
  ) {}

  ngOnInit(): void {
    this.initializeFilterFromRoute();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeFilterFromRoute(): void {
    // Listen to route changes to update current filter
    this.route.url.pipe(takeUntil(this.destroy$)).subscribe(segments => {
      if (segments.length > 0) {
        const path = segments[0].path;
        switch (path) {
          case 'active':
            this.currentFilter = 'active';
            break;
          case 'completed':
            this.currentFilter = 'completed';
            break;
          default:
            this.currentFilter = 'all';
        }
      } else {
        this.currentFilter = 'all';
      }
    });

    // Also listen to URL fragments for hash-based routing (if needed)
    this.route.fragment.pipe(takeUntil(this.destroy$)).subscribe(fragment => {
      if (fragment) {
        switch (fragment) {
          case 'active':
            this.currentFilter = 'active';
            break;
          case 'completed':
            this.currentFilter = 'completed';
            break;
          case 'all':
          default:
            this.currentFilter = 'all';
            break;
        }
      }
    });
  }
}