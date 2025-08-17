import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ClearCompletedComponent } from './clear-completed.component';
import { TodoService } from '../../../../core/services/todo.service';

describe('ClearCompletedComponent', () => {
  let component: ClearCompletedComponent;
  let fixture: ComponentFixture<ClearCompletedComponent>;
  let mockTodoService: jasmine.SpyObj<TodoService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('TodoService', ['getStats']);

    await TestBed.configureTestingModule({
      declarations: [ClearCompletedComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: TodoService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClearCompletedComponent);
    component = fixture.componentInstance;
    mockTodoService = TestBed.inject(TodoService) as jasmine.SpyObj<TodoService>;
  });

  it('should create', () => {
    mockTodoService.getStats.and.returnValue(of({ total: 0, active: 0, completed: 0 }));
    expect(component).toBeTruthy();
  });

  it('should show button when there are completed todos', () => {
    mockTodoService.getStats.and.returnValue(of({ total: 3, active: 1, completed: 2 }));
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('.clear-completed');
    expect(button).toBeTruthy();
    expect(button.textContent.trim()).toBe('Clear completed');
  });

  it('should hide button when there are no completed todos', () => {
    mockTodoService.getStats.and.returnValue(of({ total: 2, active: 2, completed: 0 }));
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('.clear-completed');
    expect(button).toBeFalsy();
  });

  it('should emit clearCompleted event when clicked', () => {
    mockTodoService.getStats.and.returnValue(of({ total: 3, active: 1, completed: 2 }));
    spyOn(component.clearCompleted, 'emit');
    
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('.clear-completed');
    button.click();
    
    expect(component.clearCompleted.emit).toHaveBeenCalled();
  });

  it('should have proper aria-label for accessibility', () => {
    mockTodoService.getStats.and.returnValue(of({ total: 3, active: 1, completed: 2 }));
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('.clear-completed');
    expect(button.getAttribute('aria-label')).toBe('Clear 2 completed todos');
  });

  it('should use singular form in aria-label for 1 completed todo', () => {
    mockTodoService.getStats.and.returnValue(of({ total: 2, active: 1, completed: 1 }));
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('.clear-completed');
    expect(button.getAttribute('aria-label')).toBe('Clear 1 completed todo');
  });
});