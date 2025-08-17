import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TodoService } from './todo.service';
import { Todo } from '../../features/todos/models/todo.interface';

describe('TodoService', () => {
  let service: TodoService;
  let httpMock: HttpTestingController;

  const mockTodos: Todo[] = [
    { id: 1, title: 'Test Todo 1', completed: false },
    { id: 2, title: 'Test Todo 2', completed: true }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TodoService]
    });
    
    service = TestBed.inject(TodoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch todos', () => {
    service.getTodos().subscribe(todos => {
      expect(todos).toEqual(mockTodos);
    });

    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush(mockTodos);
  });

  it('should create todo', () => {
    const newTodo = { title: 'New Todo', completed: false };
    const createdTodo = { id: 3, ...newTodo };

    service.createTodo(newTodo.title).subscribe(todo => {
      expect(todo).toEqual(createdTodo);
    });

    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newTodo);
    req.flush(createdTodo);
  });

  it('should throw error for empty title', () => {
    expect(() => service.createTodo('  ')).toThrowError('Todo title cannot be empty');
  });

  it('should update todo', () => {
    const todoId = 1;
    const updates = { title: 'Updated Todo' };
    const updatedTodo = { ...mockTodos[0], ...updates };

    // First populate the service with initial todos
    service.getTodos().subscribe();
    httpMock.expectOne('/api/todos').flush(mockTodos);

    service.updateTodo(todoId, updates).subscribe(todo => {
      expect(todo).toEqual(updatedTodo);
    });

    const req = httpMock.expectOne(`/api/todos/${todoId}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updates);
    req.flush(updatedTodo);
  });

  it('should delete todo', () => {
    // First populate the service with initial todos
    service.getTodos().subscribe();
    httpMock.expectOne('/api/todos').flush(mockTodos);

    service.deleteTodo(1).subscribe();

    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should toggle todo', () => {
    const todoId = 1;
    const toggledTodo = { ...mockTodos[0], completed: !mockTodos[0].completed };

    // First populate the service with initial todos
    service.getTodos().subscribe();
    httpMock.expectOne('/api/todos').flush(mockTodos);

    service.toggleTodo(todoId).subscribe(todo => {
      expect(todo).toEqual(toggledTodo);
    });

    const req = httpMock.expectOne(`/api/todos/${todoId}/toggle`);
    expect(req.request.method).toBe('PUT');
    req.flush(toggledTodo);
  });

  it('should clear completed todos', () => {
    // First populate the service with initial todos
    service.getTodos().subscribe();
    httpMock.expectOne('/api/todos').flush(mockTodos);

    service.clearCompleted().subscribe();

    const req = httpMock.expectOne('/api/todos/completed');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should calculate stats correctly', () => {
    // First populate the service with initial todos
    service.getTodos().subscribe();
    httpMock.expectOne('/api/todos').flush(mockTodos);

    service.getStats().subscribe(stats => {
      expect(stats).toEqual({ total: 2, active: 1, completed: 1 });
    });
  });
});