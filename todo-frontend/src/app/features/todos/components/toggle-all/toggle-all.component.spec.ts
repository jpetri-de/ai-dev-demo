import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ToggleAllComponent } from './toggle-all.component';
import { TodoService } from '../../../../core/services/todo.service';
import { ErrorService } from '../../../../core/services/error.service';

describe('ToggleAllComponent', () => {
  let component: ToggleAllComponent;
  let fixture: ComponentFixture<ToggleAllComponent>;
  let mockTodoService: jasmine.SpyObj<TodoService>;
  let mockErrorService: jasmine.SpyObj<ErrorService>;

  beforeEach(async () => {
    const todoServiceSpy = jasmine.createSpyObj('TodoService', ['toggleAllTodos', 'getActiveCount'], {
      allCompleted$: of(false),
      hasTodos$: of(true)
    });
    const errorServiceSpy = jasmine.createSpyObj('ErrorService', ['handleError']);

    // Set up default return values
    todoServiceSpy.getActiveCount.and.returnValue(of(0));
    todoServiceSpy.toggleAllTodos.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [ToggleAllComponent],
      providers: [
        { provide: TodoService, useValue: todoServiceSpy },
        { provide: ErrorService, useValue: errorServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleAllComponent);
    component = fixture.componentInstance;
    mockTodoService = TestBed.inject(TodoService) as jasmine.SpyObj<TodoService>;
    mockErrorService = TestBed.inject(ErrorService) as jasmine.SpyObj<ErrorService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle all todos when clicked', () => {
    // Create a fresh component with the desired mock value
    mockTodoService.getActiveCount.and.returnValue(of(2));
    mockTodoService.toggleAllTodos.and.returnValue(of([]));
    
    const newFixture = TestBed.createComponent(ToggleAllComponent);
    const newComponent = newFixture.componentInstance;

    newComponent.onToggleAll();

    expect(mockTodoService.toggleAllTodos).toHaveBeenCalledWith(true);
  });

  it('should handle toggle all error', () => {
    mockTodoService.getActiveCount.and.returnValue(of(2));
    const error = new Error('Toggle failed');
    mockTodoService.toggleAllTodos.and.returnValue(throwError(() => error));

    const newFixture = TestBed.createComponent(ToggleAllComponent);
    const newComponent = newFixture.componentInstance;

    newComponent.onToggleAll();

    expect(mockErrorService.handleError).toHaveBeenCalled();
  });
});