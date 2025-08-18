import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BehaviorSubject, interval, takeWhile, map } from 'rxjs';

export interface FilterStatusData {
  filterType: 'all' | 'active' | 'completed';
  count: number;
  totalCount: number;
}

@Component({
  selector: 'app-filter-status-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="popup-overlay" 
      [@fadeInOut]="isVisible ? 'visible' : 'hidden'"
      (click)="onClose()"
      *ngIf="isVisible || animating">
      
      <div 
        class="popup-content"
        [@slideInOut]="isVisible ? 'visible' : 'hidden'"
        (click)="$event.stopPropagation()">
        
        <div class="popup-header">
          <div class="filter-icon" [ngClass]="getFilterIconClass()">
            {{ getFilterIcon() }}
          </div>
          <h3 class="popup-title">{{ getFilterTitle() }}</h3>
        </div>
        
        <div class="popup-body">
          <div class="counter-container">
            <span class="counter-label">Showing</span>
            <span 
              class="counter-number" 
              [ngClass]="getCounterClass()">
              {{ animatedCount$ | async }}
            </span>
            <span class="counter-suffix">{{ getCounterSuffix() }}</span>
          </div>
          
          <div class="stats-summary" *ngIf="data?.totalCount">
            <small class="stats-text">
              {{ getStatsText() }}
            </small>
          </div>
        </div>
        
        <div class="popup-progress">
          <div class="progress-bar" [@progressBar]="isVisible ? 'visible' : 'hidden'"></div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./filter-status-popup.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInOut', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('hidden => visible', animate('200ms ease-in')),
      transition('visible => hidden', animate('300ms ease-out'))
    ]),
    trigger('slideInOut', [
      state('visible', style({ 
        transform: 'translateY(0) scale(1)', 
        opacity: 1 
      })),
      state('hidden', style({ 
        transform: 'translateY(-20px) scale(0.95)', 
        opacity: 0 
      })),
      transition('hidden => visible', animate('250ms cubic-bezier(0.34, 1.56, 0.64, 1)')),
      transition('visible => hidden', animate('200ms ease-out'))
    ]),
    trigger('progressBar', [
      state('visible', style({ width: '0%' })),
      state('hidden', style({ width: '100%' })),
      transition('visible => hidden', animate('2500ms linear'))
    ])
  ]
})
export class FilterStatusPopupComponent implements OnInit, OnDestroy {
  @Input() data: FilterStatusData | null = null;
  @Input() autoHideDuration = 2500;
  @Input() isVisible = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() animationComplete = new EventEmitter<void>();
  
  animating = false;
  animatedCount$ = new BehaviorSubject<number>(0);
  
  private autoHideTimer?: ReturnType<typeof setTimeout>;
  
  ngOnInit(): void {
    if (this.isVisible && this.data) {
      this.startCounterAnimation();
      this.scheduleAutoHide();
    }
  }
  
  ngOnDestroy(): void {
    this.clearAutoHideTimer();
  }
  
  onClose(): void {
    this.clearAutoHideTimer();
    this.close.emit();
  }
  
  getFilterTitle(): string {
    if (!this.data) return '';
    
    switch (this.data.filterType) {
      case 'active':
        return 'Active Todos';
      case 'completed':
        return 'Completed Todos';
      case 'all':
      default:
        return 'All Todos';
    }
  }
  
  getFilterIcon(): string {
    if (!this.data) return '📋';
    
    switch (this.data.filterType) {
      case 'active':
        return '⚡';
      case 'completed':
        return '✅';
      case 'all':
      default:
        return '📋';
    }
  }
  
  getFilterIconClass(): string {
    if (!this.data) return 'icon-all';
    
    return `icon-${this.data.filterType}`;
  }
  
  getCounterClass(): string {
    if (!this.data) return 'count-default';
    
    return `count-${this.data.filterType}`;
  }
  
  getCounterSuffix(): string {
    if (!this.data) return 'todos';
    
    const count = this.data.count;
    const suffix = count === 1 ? 'todo' : 'todos';
    
    switch (this.data.filterType) {
      case 'active':
        return `active ${suffix}`;
      case 'completed':
        return `completed ${suffix}`;
      case 'all':
      default:
        return suffix;
    }
  }
  
  getStatsText(): string {
    if (!this.data) return '';
    
    const { count, totalCount, filterType } = this.data;
    
    if (filterType === 'all') {
      const active = totalCount - count;
      const completed = count - active;
      return `${active} active, ${completed} completed`;
    } else {
      const other = totalCount - count;
      const otherType = filterType === 'active' ? 'completed' : 'active';
      return `${other} ${otherType}, ${totalCount} total`;
    }
  }
  
  private startCounterAnimation(): void {
    if (!this.data) return;
    
    const targetCount = this.data.count;
    const duration = 800; // 800ms for counter animation
    const steps = 30;
    const increment = targetCount / steps;
    
    let currentCount = 0;
    
    interval(duration / steps)
      .pipe(
        takeWhile(() => currentCount < targetCount),
        map(() => {
          currentCount = Math.min(currentCount + increment, targetCount);
          return Math.round(currentCount);
        })
      )
      .subscribe({
        next: (count) => this.animatedCount$.next(count),
        complete: () => this.animatedCount$.next(targetCount)
      });
  }
  
  private scheduleAutoHide(): void {
    this.autoHideTimer = setTimeout(() => {
      this.onClose();
    }, this.autoHideDuration);
  }
  
  private clearAutoHideTimer(): void {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = undefined;
    }
  }
}