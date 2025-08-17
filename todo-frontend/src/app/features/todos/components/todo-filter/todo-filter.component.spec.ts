import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TodoFilterComponent } from './todo-filter.component';
import { TodoFilter } from '../../models/todo.interface';

describe('TodoFilterComponent', () => {
  let component: TodoFilterComponent;
  let fixture: ComponentFixture<TodoFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TodoFilterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoFilterComponent);
    component = fixture.componentInstance;
    component.currentFilter = { type: 'all', label: 'All' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have three filter options', () => {
    expect(component.filters.length).toBe(3);
    expect(component.filters).toEqual([
      { type: 'all', label: 'All' },
      { type: 'active', label: 'Active' },
      { type: 'completed', label: 'Completed' }
    ]);
  });

  it('should emit filter change event', () => {
    spyOn(component.filterChange, 'emit');
    const activeFilter: TodoFilter = { type: 'active', label: 'Active' };
    
    component.onFilterSelect(activeFilter);
    
    expect(component.filterChange.emit).toHaveBeenCalledWith(activeFilter);
  });

  it('should identify selected filter correctly', () => {
    component.currentFilter = { type: 'active', label: 'Active' };
    
    expect(component.isFilterSelected({ type: 'active', label: 'Active' })).toBe(true);
    expect(component.isFilterSelected({ type: 'all', label: 'All' })).toBe(false);
    expect(component.isFilterSelected({ type: 'completed', label: 'Completed' })).toBe(false);
  });
});