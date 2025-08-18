import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { PopupService, ActivePopup } from '../../services/popup.service';
import { FilterStatusPopupComponent, FilterStatusData } from '../filter-status-popup/filter-status-popup.component';

@Component({
  selector: 'app-popup-container',
  standalone: true,
  imports: [CommonModule, FilterStatusPopupComponent],
  template: `
    <div class="popup-container">
      <!-- Filter Status Popups -->
      <app-filter-status-popup
        *ngFor="let popup of filterStatusPopups$ | async; trackBy: trackByPopupId"
        [data]="getFilterStatusData(popup)"
        [isVisible]="popup.isVisible"
        [autoHideDuration]="popup.duration || 2500"
        (close)="onPopupClose(popup.id)"
        (animationComplete)="onAnimationComplete(popup.id)">
      </app-filter-status-popup>
      
      <!-- Future: Other popup types can be added here -->
      <!-- 
      <app-notification-popup></app-notification-popup>
      <app-confirmation-popup></app-confirmation-popup>
      -->
    </div>
  `,
  styles: [`
    .popup-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 9999;
    }
    
    .popup-container > * {
      pointer-events: auto;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopupContainerComponent implements OnDestroy {
  
  // Observable for filter status popups
  filterStatusPopups$: Observable<ActivePopup[]> = this.popupService.getPopupsByType('filter-status');
  
  constructor(private popupService: PopupService) {}
  
  ngOnDestroy(): void {
    // Clean up any remaining popups when component is destroyed
    this.popupService.hideAllPopups();
  }
  
  /**
   * Track function for ngFor to optimize rendering
   */
  trackByPopupId(index: number, popup: ActivePopup): string {
    return popup.id;
  }
  
  /**
   * Convert popup data to FilterStatusData format
   */
  getFilterStatusData(popup: ActivePopup): FilterStatusData | null {
    if (popup.type !== 'filter-status' || !popup.data) {
      return null;
    }
    
    return {
      filterType: popup.data.filterType,
      count: popup.data.count,
      totalCount: popup.data.totalCount
    };
  }
  
  /**
   * Handle popup close events
   */
  onPopupClose(popupId: string): void {
    console.log('PopupContainer: Closing popup', popupId);
    this.popupService.hidePopup(popupId);
  }
  
  /**
   * Handle animation completion events
   */
  onAnimationComplete(popupId: string): void {
    console.log('PopupContainer: Animation completed for popup', popupId);
    // Could be used for cleanup or additional logic
  }
}