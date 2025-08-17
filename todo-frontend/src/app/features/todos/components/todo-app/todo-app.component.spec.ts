import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError, forkJoin } from 'rxjs';
import { TodoAppComponent } from './todo-app.component';
import { TodoService } from '../../../../core/services/todo.service';
import { ErrorService } from '../../../../core/services/error.service';
import { UIStateService } from '../../../../core/services/ui-state.service';
import { Todo } from '../../models/todo.interface';
import { SharedModule } from '../../../../shared/shared.module';
import { TodoListComponent } from '../todo-list/todo-list.component';
import { TodoItemComponent } from '../todo-item/todo-item.component';
import { TodoFilterComponent } from '../todo-filter/todo-filter.component';
import { TodoCounterComponent } from '../todo-counter/todo-counter.component';
import { ClearCompletedComponent } from '../clear-completed/clear-completed.component';
import { ToggleAllComponent } from '../toggle-all/toggle-all.component';

describe('TodoAppComponent', () => {
  let component: TodoAppComponent;
  let fixture: ComponentFixture<TodoAppComponent>;
  let todoService: jasmine.SpyObj<TodoService>;
  let errorService: jasmine.SpyObj<ErrorService>;
  let uiStateService: jasmine.SpyObj<UIStateService>;

  const mockTodos: Todo[] = [
    { id: 1, title: 'Test Todo 1', completed: false },
    { id: 2, title: 'Test Todo 2', completed: true }
  ];

  beforeEach(async () => {
    const todoServiceSpy = jasmine.createSpyObj('TodoService', [
      'getTodos', 'createTodo', 'updateTodo', 'deleteTodo', 
      'toggleTodo', 'toggleAllTodos', 'clearCompleted', 'getStats',
      'getActiveCount', 'getCompletedCount'
    ], {
      todos$: of(mockTodos),
      hasTodos$: of(true),
      hasCompleted$: of(true),
      allCompleted$: of(false),
      loading$: of(false)
    });

    const errorServiceSpy = jasmine.createSpyObj('ErrorService', [
      'handleError', 'clearError'
    ], {
      error$: of('')
    });

    const uiStateServiceSpy = jasmine.createSpyObj('UIStateService', [
      'setCurrentFilter', 'updateVisibility', 'setLoading', 'focusNewTodoInput', 'setupKeyboardNavigation'
    ], {
      showMain$: of(true),
      showFooter$: of(true),
      currentFilter$: of('all')
    });

    todoServiceSpy.getTodos.and.returnValue(of(mockTodos));
    todoServiceSpy.getStats.and.returnValue(of({ total: 2, active: 1, completed: 1 }));
    todoServiceSpy.getActiveCount.and.returnValue(of(1));
    todoServiceSpy.getCompletedCount.and.returnValue(of(1));

    await TestBed.configureTestingModule({
      declarations: [
        TodoAppComponent,
        TodoListComponent,
        TodoItemComponent,
        TodoFilterComponent,
        TodoCounterComponent,
        ClearCompletedComponent,
        ToggleAllComponent
      ],
      imports: [HttpClientTestingModule, RouterTestingModule, SharedModule],
      providers: [
        { provide: TodoService, useValue: todoServiceSpy },
        { provide: ErrorService, useValue: errorServiceSpy },
        { provide: UIStateService, useValue: uiStateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoAppComponent);
    component = fixture.componentInstance;
    todoService = TestBed.inject(TodoService) as jasmine.SpyObj<TodoService>;
    errorService = TestBed.inject(ErrorService) as jasmine.SpyObj<ErrorService>;
    uiStateService = TestBed.inject(UIStateService) as jasmine.SpyObj<UIStateService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load todos on init', () => {
    component.ngOnInit();
    expect(todoService.getTodos).toHaveBeenCalled();
  });

  it('should create todo when valid title provided', () => {
    const title = 'New Todo';
    todoService.createTodo.and.returnValue(of({ id: 3, title, completed: false }));
    
    component.onCreateTodo(title);
    
    expect(todoService.createTodo).toHaveBeenCalledWith(title);
  });

  it('should not create todo when empty title provided', () => {
    component.onCreateTodo('  ');
    
    expect(todoService.createTodo).not.toHaveBeenCalled();
  });

  it('should toggle todo', () => {
    const todoId = 1;
    todoService.toggleTodo.and.returnValue(of(mockTodos[0]));
    
    component.onToggleTodo(todoId);
    
    expect(todoService.toggleTodo).toHaveBeenCalledWith(todoId);
  });

  it('should delete todo', () => {
    const todoId = 1;
    todoService.deleteTodo.and.returnValue(of(undefined));
    
    component.onDeleteTodo(todoId);
    
    expect(todoService.deleteTodo).toHaveBeenCalledWith(todoId);
  });

  it('should update todo', () => {
    const updateData = { id: 1, title: 'Updated Todo' };
    todoService.updateTodo.and.returnValue(of({ ...mockTodos[0], title: updateData.title }));
    
    component.onUpdateTodo(updateData);
    
    expect(todoService.updateTodo).toHaveBeenCalledWith(updateData.id, updateData.title);
  });

  it('should handle empty title deletion workflow', () => {
    const updateData = { id: 1, title: '  ' };
    todoService.deleteTodo.and.returnValue(of(undefined));
    
    component.onUpdateTodo(updateData);
    
    expect(todoService.deleteTodo).toHaveBeenCalledWith(updateData.id);
    expect(todoService.updateTodo).not.toHaveBeenCalled();
  });

  // Note: Clear completed functionality has been moved to ClearCompletedComponent

  it('should clear error', () => {
    component.clearError();
    
    expect(errorService.clearError).toHaveBeenCalled();
  });

  describe('input validation and error handling', () => {
    it('should show error for empty title when creating todo', () => {
      component.onCreateTodo('');
      
      expect(errorService.handleError).toHaveBeenCalledWith('Todo title cannot be empty');
      expect(todoService.createTodo).not.toHaveBeenCalled();
    });

    it('should show error for title exceeding max length when creating todo', () => {
      const longTitle = 'a'.repeat(501);
      
      component.onCreateTodo(longTitle);
      
      expect(errorService.handleError).toHaveBeenCalledWith('Todo title cannot exceed 500 characters');
      expect(todoService.createTodo).not.toHaveBeenCalled();
    });

    it('should show error for title exceeding max length when updating todo', () => {
      const longTitle = 'a'.repeat(501);
      
      component.onUpdateTodo({ id: 1, title: longTitle });
      
      expect(errorService.handleError).toHaveBeenCalledWith('Todo title cannot exceed 500 characters');
      expect(todoService.updateTodo).not.toHaveBeenCalled();
    });

    it('should handle error when creating todo fails', () => {
      const errorMessage = 'Server error';
      todoService.createTodo.and.returnValue(throwError(() => ({ message: errorMessage })));
      
      component.onCreateTodo('Test Todo');
      
      expect(errorService.handleError).toHaveBeenCalledWith(errorMessage);
    });

    it('should handle error when updating todo fails', () => {
      const errorMessage = 'Server error';
      todoService.updateTodo.and.returnValue(throwError(() => ({ message: errorMessage })));
      
      component.onUpdateTodo({ id: 1, title: 'Updated Todo' });
      
      expect(errorService.handleError).toHaveBeenCalledWith(errorMessage);
    });

    it('should handle error when toggling todo fails', () => {
      todoService.toggleTodo.and.returnValue(throwError(() => ({ message: 'Server error' })));
      
      component.onToggleTodo(1);
      
      expect(errorService.handleError).toHaveBeenCalledWith('Server error');
    });

    it('should handle error when deleting todo fails', () => {
      todoService.deleteTodo.and.returnValue(throwError(() => ({ message: 'Server error' })));
      
      component.onDeleteTodo(1);
      
      expect(errorService.handleError).toHaveBeenCalledWith('Server error');
    });

    // Note: Clear completed error handling has been moved to ClearCompletedComponent

    it('should handle error when loading todos fails', () => {
      const errorMessage = 'Network error';
      todoService.getTodos.and.returnValue(throwError(() => ({ message: errorMessage })));
      
      component.ngOnInit();
      
      expect(errorService.handleError).toHaveBeenCalledWith(errorMessage);
    });
  });

  // Note: Filter functionality has been moved to TodoFilterComponent and UIStateService

  // Note: Toggle all functionality has been moved to ToggleAllComponent

  describe('component lifecycle', () => {
    it('should clean up subscriptions on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});