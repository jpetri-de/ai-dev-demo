import { TestBed } from '@angular/core/testing';
import { UIStateService, UIState } from './ui-state.service';

describe('UIStateService', () => {
  let service: UIStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UIStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default state', () => {
    const state = service.getCurrentState();
    expect(state).toEqual({
      showMain: false,
      showFooter: false,
      inputFocused: false,
      isLoading: false,
      currentFilter: 'all'
    });
  });

  it('should update visibility when todos exist', () => {
    service.updateVisibility(true);
    const state = service.getCurrentState();
    expect(state.showMain).toBe(true);
    expect(state.showFooter).toBe(true);
  });

  it('should hide main and footer when no todos', () => {
    service.updateVisibility(false);
    const state = service.getCurrentState();
    expect(state.showMain).toBe(false);
    expect(state.showFooter).toBe(false);
  });

  it('should update loading state', () => {
    service.setLoading(true);
    expect(service.getCurrentState().isLoading).toBe(true);
    
    service.setLoading(false);
    expect(service.getCurrentState().isLoading).toBe(false);
  });

  it('should update input focus state', () => {
    service.setInputFocused(true);
    expect(service.getCurrentState().inputFocused).toBe(true);
    
    service.setInputFocused(false);
    expect(service.getCurrentState().inputFocused).toBe(false);
  });

  it('should update current filter', () => {
    service.setCurrentFilter('active');
    expect(service.getCurrentState().currentFilter).toBe('active');
    
    service.setCurrentFilter('completed');
    expect(service.getCurrentState().currentFilter).toBe('completed');
  });

  it('should determine visibility based on todos count', () => {
    expect(service.shouldShowMainAndFooter(0)).toBe(false);
    expect(service.shouldShowMainAndFooter(1)).toBe(true);
    expect(service.shouldShowMainAndFooter(5)).toBe(true);
  });

  it('should reset state to defaults', () => {
    // Modify state
    service.setLoading(true);
    service.setCurrentFilter('active');
    service.setInputFocused(true);
    
    // Reset
    service.resetState();
    
    const state = service.getCurrentState();
    expect(state).toEqual({
      showMain: false,
      showFooter: false,
      inputFocused: false,
      isLoading: false,
      currentFilter: 'all'
    });
  });

  it('should emit state changes through observables', (done) => {
    service.showMain$.subscribe(showMain => {
      if (showMain) {
        expect(showMain).toBe(true);
        done();
      }
    });
    
    service.updateVisibility(true);
  });
});