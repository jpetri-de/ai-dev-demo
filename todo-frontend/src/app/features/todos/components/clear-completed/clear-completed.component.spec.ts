import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ClearCompletedComponent } from './clear-completed.component';
import { TodoService } from '../../../../core/services/todo.service';
import { ErrorService } from '../../../../core/services/error.service';

describe('ClearCompletedComponent', () => {
  let component: ClearCompletedComponent;
  let fixture: ComponentFixture<ClearCompletedComponent>;
  let mockTodoService: jasmine.SpyObj<TodoService>;
  let mockErrorService: jasmine.SpyObj<ErrorService>;

  beforeEach(async () => {
    const todoServiceSpy = jasmine.createSpyObj('TodoService', ['clearCompleted', 'getCompletedCount'], {
      hasCompleted$: of(true)
    });
    const errorServiceSpy = jasmine.createSpyObj('ErrorService', ['handleError']);

    // Set default return values
    todoServiceSpy.getCompletedCount.and.returnValue(of(2));
    todoServiceSpy.clearCompleted.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      declarations: [ClearCompletedComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: TodoService, useValue: todoServiceSpy },
        { provide: ErrorService, useValue: errorServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClearCompletedComponent);
    component = fixture.componentInstance;
    mockTodoService = TestBed.inject(TodoService) as jasmine.SpyObj<TodoService>;
    mockErrorService = TestBed.inject(ErrorService) as jasmine.SpyObj<ErrorService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show button when there are completed todos', () => {
    mockTodoService.hasCompleted$ = of(true);
    fixture.detectChanges();
    
    const button = fixture.nativeElement.querySelector('.clear-completed');
    expect(button).toBeTruthy();
  });

  it('should hide button when there are no completed todos', async () => {
    // Reset the test bed for this specific test
    TestBed.resetTestingModule();
    
    const todoServiceSpy = jasmine.createSpyObj('TodoService', ['clearCompleted', 'getCompletedCount'], {
      hasCompleted$: of(false)
    });
    todoServiceSpy.getCompletedCount.and.returnValue(of(0));
    todoServiceSpy.clearCompleted.and.returnValue(of(undefined));

    const errorServiceSpy = jasmine.createSpyObj('ErrorService', ['handleError']);

    await TestBed.configureTestingModule({
      declarations: [ClearCompletedComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: TodoService, useValue: todoServiceSpy },
        { provide: ErrorService, useValue: errorServiceSpy }
      ]
    }).compileComponents();

    const newFixture = TestBed.createComponent(ClearCompletedComponent);
    newFixture.detectChanges();
    
    const button = newFixture.nativeElement.querySelector('.clear-completed');
    expect(button).toBeFalsy();
  });

  it('should call clearCompleted when clicked', () => {
    mockTodoService.clearCompleted.and.returnValue(of(undefined));
    mockTodoService.getCompletedCount.and.returnValue(of(2));
    
    component.onClearCompleted();
    
    expect(mockTodoService.clearCompleted).toHaveBeenCalled();
  });

  it('should handle errors when clear completed fails', () => {
    const error = new Error('Clear failed');
    mockTodoService.clearCompleted.and.returnValue(throwError(() => error));
    
    // Create fresh component for this test
    const newFixture = TestBed.createComponent(ClearCompletedComponent);
    const newComponent = newFixture.componentInstance;
    
    newComponent.onClearCompleted();
    
    expect(mockErrorService.handleError).toHaveBeenCalledWith('Clear failed');
  });

  it('should show confirmation for large numbers of completed todos', () => {
    // Create fresh component with large count
    mockTodoService.getCompletedCount.and.returnValue(of(15));
    const newFixture = TestBed.createComponent(ClearCompletedComponent);
    const newComponent = newFixture.componentInstance;
    
    spyOn(window, 'confirm').and.returnValue(false);
    
    newComponent.onClearCompleted();
    
    expect(window.confirm).toHaveBeenCalled();
  });
});