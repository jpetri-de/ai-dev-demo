import { TestBed } from '@angular/core/testing';
import { PopupService, PopupConfig, ActivePopup } from './popup.service';

describe('PopupService', () => {
  let service: PopupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PopupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show filter status popup with correct data', () => {
    const filterType = 'active';
    const count = 3;
    const totalCount = 5;
    
    const popupId = service.showFilterStatus(filterType, count, totalCount);
    
    expect(popupId).toBeTruthy();
    expect(popupId).toContain('filter-status');
    
    service.popups$.subscribe(popups => {
      if (popups.length > 0) {
        const popup = popups[0];
        expect(popup.type).toBe('filter-status');
        expect(popup.data.filterType).toBe(filterType);
        expect(popup.data.count).toBe(count);
        expect(popup.data.totalCount).toBe(totalCount);
      }
    });
  });

  it('should hide popup by ID', () => {
    const popupId = service.showFilterStatus('all', 5, 5);
    
    // Verify popup exists
    service.popups$.subscribe(popups => {
      if (popups.length > 0) {
        expect(popups.find(p => p.id === popupId)).toBeTruthy();
      }
    });
    
    // Hide popup
    service.hidePopup(popupId);
    
    // Verify popup is removed
    service.popups$.subscribe(popups => {
      expect(popups.find(p => p.id === popupId)).toBeUndefined();
    });
  });

  it('should hide all popups of specific type', () => {
    service.showFilterStatus('active', 2, 5);
    service.showFilterStatus('completed', 3, 5);
    service.showSuccess('Test success message');
    
    service.hidePopupsByType('filter-status');
    
    service.popups$.subscribe(popups => {
      const filterPopups = popups.filter(p => p.type === 'filter-status');
      const successPopups = popups.filter(p => p.type === 'success');
      
      expect(filterPopups.length).toBe(0);
      expect(successPopups.length).toBe(1);
    });
  });

  it('should hide all popups', () => {
    service.showFilterStatus('active', 2, 5);
    service.showSuccess('Test message');
    service.showError('Test error');
    
    service.hideAllPopups();
    
    service.popups$.subscribe(popups => {
      expect(popups.length).toBe(0);
    });
  });

  it('should sort popups by priority and timestamp', () => {
    const highPriorityId = service.showError('High priority error'); // priority 10
    const lowPriorityId = service.showFilterStatus('active', 2, 5); // priority 1
    const mediumPriorityId = service.showSuccess('Medium priority success'); // no priority (0)
    
    service.popups$.subscribe(popups => {
      if (popups.length === 3) {
        expect(popups[0].id).toBe(highPriorityId); // Highest priority first
        expect(popups[1].id).toBe(lowPriorityId);  // Then filter status
        expect(popups[2].id).toBe(mediumPriorityId); // Lowest priority last
      }
    });
  });

  it('should return observable for specific popup by ID', (done) => {
    const popupId = service.showFilterStatus('completed', 1, 3);
    
    service.getPopup(popupId).subscribe(popup => {
      if (popup) {
        expect(popup.id).toBe(popupId);
        expect(popup.type).toBe('filter-status');
        done();
      }
    });
  });

  it('should return observable for popups by type', (done) => {
    service.showFilterStatus('active', 2, 5);
    service.showFilterStatus('completed', 3, 5);
    service.showSuccess('Not a filter status');
    
    service.getPopupsByType('filter-status').subscribe(popups => {
      if (popups.length === 2) {
        expect(popups.every(p => p.type === 'filter-status')).toBe(true);
        done();
      }
    });
  });

  it('should detect if any popups are active', (done) => {
    // Initially no popups
    service.hasActivePopups().subscribe(hasActive => {
      if (!hasActive) {
        // Add a popup
        service.showFilterStatus('all', 5, 5);
        
        // Check again
        service.hasActivePopups().subscribe(hasActiveAfter => {
          if (hasActiveAfter) {
            expect(hasActiveAfter).toBe(true);
            done();
          }
        });
      }
    });
  });

  it('should generate unique popup IDs', () => {
    const id1 = service.showFilterStatus('active', 1, 3);
    const id2 = service.showFilterStatus('completed', 2, 3);
    
    expect(id1).not.toBe(id2);
    expect(id1).toContain('filter-status');
    expect(id2).toContain('filter-status');
  });

  it('should show convenience popups with correct properties', () => {
    const successId = service.showSuccess('Success message', 'Success Title');
    const errorId = service.showError('Error message', 'Error Title');
    const infoId = service.showInfo('Info message');
    const warningId = service.showWarning('Warning message');
    
    service.popups$.subscribe(popups => {
      if (popups.length === 4) {
        const successPopup = popups.find(p => p.id === successId);
        const errorPopup = popups.find(p => p.id === errorId);
        const infoPopup = popups.find(p => p.id === infoId);
        const warningPopup = popups.find(p => p.id === warningId);
        
        expect(successPopup?.type).toBe('success');
        expect(successPopup?.title).toBe('Success Title');
        expect(successPopup?.message).toBe('Success message');
        
        expect(errorPopup?.type).toBe('error');
        expect(errorPopup?.priority).toBe(10);
        
        expect(infoPopup?.type).toBe('info');
        expect(warningPopup?.type).toBe('warning');
      }
    });
  });
});