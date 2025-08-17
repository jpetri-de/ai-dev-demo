import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TodoListComponent } from './todo-list.component';
import { TodoItemComponent } from '../todo-item/todo-item.component';
import { SharedModule } from '../../../../shared/shared.module';
import { Todo } from '../../models/todo.interface';

describe('TodoListComponent', () => {
  let component: TodoListComponent;
  let fixture: ComponentFixture<TodoListComponent>;

  const mockTodos: Todo[] = [
    { id: 1, title: 'Test Todo 1', completed: false },
    { id: 2, title: 'Test Todo 2', completed: true },
    { id: 3, title: 'Test Todo 3', completed: false }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TodoListComponent, TodoItemComponent],
      imports: [SharedModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return all todos when filter is "all"', () => {
    component.todos = mockTodos;
    component.filter = { type: 'all', label: 'All' };
    
    expect(component.filteredTodos).toEqual(mockTodos);
  });

  it('should return only active todos when filter is "active"', () => {
    component.todos = mockTodos;
    component.filter = { type: 'active', label: 'Active' };
    
    const activeTodos = mockTodos.filter(todo => !todo.completed);
    expect(component.filteredTodos).toEqual(activeTodos);
  });

  it('should return only completed todos when filter is "completed"', () => {
    component.todos = mockTodos;
    component.filter = { type: 'completed', label: 'Completed' };
    
    const completedTodos = mockTodos.filter(todo => todo.completed);
    expect(component.filteredTodos).toEqual(completedTodos);
  });

  it('should return empty array when todos is null', () => {
    component.todos = null;
    component.filter = { type: 'all', label: 'All' };
    
    expect(component.filteredTodos).toEqual([]);
  });

  it('should track todos by id', () => {
    const todo = mockTodos[0];
    const trackResult = component.trackByTodo(0, todo);
    
    expect(trackResult).toBe(1);
  });

  it('should track todos by index when id is not available', () => {
    const todoWithoutId = { title: 'Test', completed: false };
    const trackResult = component.trackByTodo(5, todoWithoutId as Todo);
    
    expect(trackResult).toBe(5);
  });
});