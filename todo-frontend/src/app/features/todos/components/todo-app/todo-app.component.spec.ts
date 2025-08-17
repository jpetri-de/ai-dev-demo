import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
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
      imports: [HttpClientTestingModule, SharedModule],
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
    
    expect(todoService.updateTodo).toHaveBeenCalledWith(updateData.id, { title: updateData.title });
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
});