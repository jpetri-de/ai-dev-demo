import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError, forkJoin } from 'rxjs';
import { TodoAppComponent } from './todo-app.component';
import { TodoService } from '../../../../core/services/todo.service';
import { ErrorService } from '../../../../core/services/error.service';
import { Todo } from '../../models/todo.interface';
import { SharedModule } from '../../../../shared/shared.module';
import { TodoListComponent } from '../todo-list/todo-list.component';
import { TodoItemComponent } from '../todo-item/todo-item.component';
import { TodoFilterComponent } from '../todo-filter/todo-filter.component';

describe('TodoAppComponent', () => {
  let component: TodoAppComponent;
  let fixture: ComponentFixture<TodoAppComponent>;
  let todoService: jasmine.SpyObj<TodoService>;
  let errorService: jasmine.SpyObj<ErrorService>;

  const mockTodos: Todo[] = [
    { id: 1, title: 'Test Todo 1', completed: false },
    { id: 2, title: 'Test Todo 2', completed: true }
  ];

  beforeEach(async () => {
    const todoServiceSpy = jasmine.createSpyObj('TodoService', [
      'getTodos', 'createTodo', 'updateTodo', 'deleteTodo', 
      'toggleTodo', 'toggleAllTodos', 'clearCompleted', 'getStats'
    ], {
      todos$: of(mockTodos)
    });

    const errorServiceSpy = jasmine.createSpyObj('ErrorService', [
      'handleError', 'clearError'
    ], {
      error$: of('')
    });

    todoServiceSpy.getTodos.and.returnValue(of(mockTodos));
    todoServiceSpy.getStats.and.returnValue(of({ total: 2, active: 1, completed: 1 }));

    await TestBed.configureTestingModule({
      declarations: [
        TodoAppComponent,
        TodoListComponent,
        TodoItemComponent,
        TodoFilterComponent
      ],
      imports: [HttpClientTestingModule, RouterTestingModule, SharedModule],
      providers: [
        { provide: TodoService, useValue: todoServiceSpy },
        { provide: ErrorService, useValue: errorServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoAppComponent);
    component = fixture.componentInstance;
    todoService = TestBed.inject(TodoService) as jasmine.SpyObj<TodoService>;
    errorService = TestBed.inject(ErrorService) as jasmine.SpyObj<ErrorService>;
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

  it('should clear completed todos', () => {
    todoService.clearCompleted.and.returnValue(of(undefined));
    
    component.onClearCompleted();
    
    expect(todoService.clearCompleted).toHaveBeenCalled();
  });

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

    it('should handle error when clearing completed todos fails', () => {
      todoService.clearCompleted.and.returnValue(throwError(() => ({ message: 'Server error' })));
      
      component.onClearCompleted();
      
      expect(errorService.handleError).toHaveBeenCalledWith('Server error');
    });

    it('should handle error when loading todos fails', () => {
      const errorMessage = 'Network error';
      todoService.getTodos.and.returnValue(throwError(() => ({ message: errorMessage })));
      
      component.ngOnInit();
      
      expect(errorService.handleError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('filter functionality', () => {
    it('should change current filter', () => {
      const newFilter = { type: 'active' as const, label: 'Active' };
      
      component.onFilterChange(newFilter);
      
      expect(component.currentFilter).toEqual(newFilter);
    });
  });

  describe('toggle all functionality', () => {
    it('should toggle all todos to completed when some are active', () => {
      const stats = { total: 2, active: 1, completed: 1 };
      const activeTodo = { id: 1, title: 'Active Todo', completed: false };
      const completedTodo = { id: 2, title: 'Completed Todo', completed: true };
      
      todoService.getStats.and.returnValue(of(stats));
      component.todos$ = of([activeTodo, completedTodo]);
      todoService.toggleTodo.and.returnValue(of({ ...activeTodo, completed: true }));
      
      component.onToggleAll();
      
      expect(todoService.toggleTodo).toHaveBeenCalledWith(1);
    });

    it('should toggle all todos to active when all are completed', () => {
      const stats = { total: 2, active: 0, completed: 2 };
      const completedTodo1 = { id: 1, title: 'Todo 1', completed: true };
      const completedTodo2 = { id: 2, title: 'Todo 2', completed: true };
      
      todoService.getStats.and.returnValue(of(stats));
      component.todos$ = of([completedTodo1, completedTodo2]);
      todoService.toggleTodo.and.returnValue(of({ ...completedTodo1, completed: false }));
      
      component.onToggleAll();
      
      expect(todoService.toggleTodo).toHaveBeenCalledWith(1);
      expect(todoService.toggleTodo).toHaveBeenCalledWith(2);
    });

    it('should not perform any toggles when no todos need to be toggled', () => {
      const stats = { total: 1, active: 1, completed: 0 };
      const activeTodo = { id: 1, title: 'Active Todo', completed: false };
      
      todoService.getStats.and.returnValue(of(stats));
      component.todos$ = of([activeTodo]);
      
      component.onToggleAll();
      
      expect(todoService.toggleTodo).not.toHaveBeenCalled();
    });

    it('should handle error when toggle all fails', () => {
      const stats = { total: 2, active: 2, completed: 0 };
      const activeTodo1 = { id: 1, title: 'Active Todo 1', completed: false };
      const activeTodo2 = { id: 2, title: 'Active Todo 2', completed: false };
      
      todoService.getStats.and.returnValue(of(stats));
      component.todos$ = of([activeTodo1, activeTodo2]);
      todoService.toggleTodo.and.returnValue(throwError(() => new Error('Server error')));
      
      component.onToggleAll();
      
      expect(errorService.handleError).toHaveBeenCalledWith('Failed to toggle all todos');
    });
  });

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