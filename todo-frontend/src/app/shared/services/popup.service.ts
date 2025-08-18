import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { take } from 'rxjs/operators';

export interface PopupConfig {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'filter-status';
  title?: string;
  message?: string;
  data?: any;
  autoHide?: boolean;
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
  priority?: number;
}

export interface ActivePopup extends PopupConfig {
  timestamp: number;
  isVisible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  private popupsSubject = new BehaviorSubject<ActivePopup[]>([]);
  public popups$ = this.popupsSubject.asObservable();
  
  private popupCounter = 0;
  
  constructor() {}
  
  /**
   * Shows a filter status popup with todo statistics
   */
  showFilterStatus(filterType: 'all' | 'active' | 'completed', count: number, totalCount: number): string {
    const popupId = this.generatePopupId('filter-status');
    
    const popup: PopupConfig = {
      id: popupId,
      type: 'filter-status',
      title: this.getFilterTitle(filterType),
      data: {
        filterType,
        count,
        totalCount
      },
      autoHide: true,
      duration: 2500,
      position: 'top',
      priority: 1
    };
    
    this.showPopup(popup);
    return popupId;
  }
  
  /**
   * Shows a general popup with specified configuration
   */
  showPopup(config: PopupConfig): string {
    const popup: ActivePopup = {
      ...config,
      id: config.id || this.generatePopupId(config.type),
      timestamp: Date.now(),
      isVisible: true
    };
    
    // Add popup to active list
    const currentPopups = this.popupsSubject.value;
    const updatedPopups = [...currentPopups, popup];
    
    // Sort by priority (higher priority first) and timestamp
    updatedPopups.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });
    
    this.popupsSubject.next(updatedPopups);
    
    // Auto-hide if configured
    if (popup.autoHide && popup.duration) {
      timer(popup.duration).pipe(take(1)).subscribe(() => {
        this.hidePopup(popup.id);
      });
    }
    
    return popup.id;
  }
  
  /**
   * Hides a specific popup by ID
   */
  hidePopup(popupId: string): void {
    const currentPopups = this.popupsSubject.value;
    const updatedPopups = currentPopups.filter(popup => popup.id !== popupId);
    this.popupsSubject.next(updatedPopups);
  }
  
  /**
   * Hides all popups of a specific type
   */
  hidePopupsByType(type: string): void {
    const currentPopups = this.popupsSubject.value;
    const updatedPopups = currentPopups.filter(popup => popup.type !== type);
    this.popupsSubject.next(updatedPopups);
  }
  
  /**
   * Hides all popups
   */
  hideAllPopups(): void {
    this.popupsSubject.next([]);
  }
  
  /**
   * Gets active popup by ID
   */
  getPopup(popupId: string): Observable<ActivePopup | undefined> {
    return new Observable(observer => {
      const subscription = this.popups$.subscribe(popups => {
        const popup = popups.find(p => p.id === popupId);
        observer.next(popup);
      });
      
      return () => subscription.unsubscribe();
    });
  }
  
  /**
   * Gets all active popups of a specific type
   */
  getPopupsByType(type: string): Observable<ActivePopup[]> {
    return new Observable(observer => {
      const subscription = this.popups$.subscribe(popups => {
        const filteredPopups = popups.filter(p => p.type === type);
        observer.next(filteredPopups);
      });
      
      return () => subscription.unsubscribe();
    });
  }
  
  /**
   * Checks if any popup is currently visible
   */
  hasActivePopups(): Observable<boolean> {
    return new Observable(observer => {
      const subscription = this.popups$.subscribe(popups => {
        observer.next(popups.length > 0);
      });
      
      return () => subscription.unsubscribe();
    });
  }
  
  /**
   * Generates unique popup ID
   */
  private generatePopupId(type: string): string {
    this.popupCounter++;
    return `${type}-popup-${this.popupCounter}-${Date.now()}`;
  }
  
  /**
   * Gets human-readable title for filter type
   */
  private getFilterTitle(filterType: 'all' | 'active' | 'completed'): string {
    switch (filterType) {
      case 'active':
        return 'Active Todos';
      case 'completed':
        return 'Completed Todos';
      case 'all':
      default:
        return 'All Todos';
    }
  }
  
  // Convenience methods for common popup types
  
  showSuccess(message: string, title?: string, duration = 3000): string {
    return this.showPopup({
      id: this.generatePopupId('success'),
      type: 'success',
      title: title || 'Success',
      message,
      autoHide: true,
      duration,
      position: 'top'
    });
  }
  
  showError(message: string, title?: string, autoHide = true): string {
    return this.showPopup({
      id: this.generatePopupId('error'),
      type: 'error',
      title: title || 'Error',
      message,
      autoHide,
      duration: autoHide ? 4000 : undefined,
      position: 'top',
      priority: 10
    });
  }
  
  showInfo(message: string, title?: string, duration = 3000): string {
    return this.showPopup({
      id: this.generatePopupId('info'),
      type: 'info',
      title: title || 'Information',
      message,
      autoHide: true,
      duration,
      position: 'top'
    });
  }
  
  showWarning(message: string, title?: string, duration = 4000): string {
    return this.showPopup({
      id: this.generatePopupId('warning'),
      type: 'warning',
      title: title || 'Warning',
      message,
      autoHide: true,
      duration,
      position: 'top'
    });
  }
}