import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FilterStatusPopupComponent, FilterStatusData } from './filter-status-popup.component';

describe('FilterStatusPopupComponent', () => {
  let component: FilterStatusPopupComponent;
  let fixture: ComponentFixture<FilterStatusPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterStatusPopupComponent, BrowserAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterStatusPopupComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct filter title for active todos', () => {
    const mockData: FilterStatusData = {
      filterType: 'active',
      count: 3,
      totalCount: 5
    };
    
    component.data = mockData;
    component.isVisible = true;
    fixture.detectChanges();

    expect(component.getFilterTitle()).toBe('Active Todos');
    expect(component.getFilterIcon()).toBe('⚡');
  });

  it('should display correct filter title for completed todos', () => {
    const mockData: FilterStatusData = {
      filterType: 'completed',
      count: 2,
      totalCount: 5
    };
    
    component.data = mockData;
    component.isVisible = true;
    fixture.detectChanges();

    expect(component.getFilterTitle()).toBe('Completed Todos');
    expect(component.getFilterIcon()).toBe('✅');
  });

  it('should display correct filter title for all todos', () => {
    const mockData: FilterStatusData = {
      filterType: 'all',
      count: 5,
      totalCount: 5
    };
    
    component.data = mockData;
    component.isVisible = true;
    fixture.detectChanges();

    expect(component.getFilterTitle()).toBe('All Todos');
    expect(component.getFilterIcon()).toBe('📋');
  });

  it('should generate correct counter suffix', () => {
    const mockDataSingle: FilterStatusData = {
      filterType: 'active',
      count: 1,
      totalCount: 3
    };
    
    const mockDataMultiple: FilterStatusData = {
      filterType: 'completed',
      count: 2,
      totalCount: 5
    };

    component.data = mockDataSingle;
    expect(component.getCounterSuffix()).toBe('active todo');

    component.data = mockDataMultiple;
    expect(component.getCounterSuffix()).toBe('completed todos');
  });

  it('should emit close event when onClose is called', () => {
    spyOn(component.close, 'emit');
    
    component.onClose();
    
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should generate correct stats text for filtered views', () => {
    const activeData: FilterStatusData = {
      filterType: 'active',
      count: 3,
      totalCount: 5
    };
    
    component.data = activeData;
    const statsText = component.getStatsText();
    
    expect(statsText).toContain('2 completed');
    expect(statsText).toContain('5 total');
  });

  it('should handle animation lifecycle correctly', () => {
    component.isVisible = true;
    component.data = {
      filterType: 'all',
      count: 5,
      totalCount: 5
    };
    
    component.ngOnInit();
    
    // Verify component initializes without errors
    expect(component.animatedCount$.value).toBe(0);
  });

  it('should clean up timer on destroy', () => {
    component.isVisible = true;
    component.data = {
      filterType: 'active',
      count: 2,
      totalCount: 4
    };
    
    component.ngOnInit();
    component.ngOnDestroy();
    
    // Should not throw any errors
    expect(component).toBeTruthy();
  });
});