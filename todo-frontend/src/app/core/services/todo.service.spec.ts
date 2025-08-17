import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TodoService } from './todo.service';
import { Todo, CreateTodoRequest, UpdateTodoRequest } from '../../features/todos/models';

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

  describe('getTodos', () => {
    it('should retrieve todos from API', () => {
      service.getTodos().subscribe(todos => {
        expect(todos).toEqual(mockTodos);
      });

      const req = httpMock.expectOne('/api/todos');
      expect(req.request.method).toBe('GET');
      req.flush(mockTodos);
    });

    it('should update loading state correctly', () => {
      let loadingStates: boolean[] = [];
      service.loading$.subscribe(loading => loadingStates.push(loading));

      service.getTodos().subscribe();
      const req = httpMock.expectOne('/api/todos');
      req.flush(mockTodos);

      expect(loadingStates).toEqual([false, true, false]);
    });
  });

  describe('createTodo', () => {
    it('should create todo via POST request', () => {
      const newTodoTitle = 'New Test Todo';
      const createdTodo: Todo = { id: 3, title: newTodoTitle, completed: false };

      service.createTodo(newTodoTitle).subscribe(todo => {
        expect(todo).toEqual(createdTodo);
      });

      const req = httpMock.expectOne('/api/todos');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ title: newTodoTitle });
      req.flush(createdTodo);
    });

    it('should validate title before API call', () => {
      service.createTodo('').subscribe({
        next: () => fail('Should not succeed with empty title'),
        error: error => expect(error.message).toContain('cannot be empty')
      });

      httpMock.expectNone('/api/todos');
    });

    it('should validate title length', () => {
      const longTitle = 'a'.repeat(501);
      
      service.createTodo(longTitle).subscribe({
        next: () => fail('Should not succeed with long title'),
        error: error => expect(error.message).toContain('cannot exceed 500 characters')
      });

      httpMock.expectNone('/api/todos');
    });

    it('should trim title before sending', () => {
      const titleWithSpaces = '  Test Todo  ';
      const trimmedTitle = 'Test Todo';
      const createdTodo: Todo = { id: 3, title: trimmedTitle, completed: false };

      service.createTodo(titleWithSpaces).subscribe();

      const req = httpMock.expectOne('/api/todos');
      expect(req.request.body).toEqual({ title: trimmedTitle });
      req.flush(createdTodo);
    });

    it('should perform optimistic update and rollback on error', () => {
      // Set initial state
      service.getTodos().subscribe();
      const getReq = httpMock.expectOne('/api/todos');
      getReq.flush(mockTodos);

      let todosState: Todo[] = [];
      service.todos$.subscribe(todos => todosState = todos);

      // Attempt to create todo that will fail
      service.createTodo('Test').subscribe({
        error: () => {} // Ignore error for this test
      });

      // Should see optimistic update first
      expect(todosState.length).toBe(3); // Original 2 + optimistic 1

      // Then API call fails
      const createReq = httpMock.expectOne('/api/todos');
      createReq.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      // Should rollback to original state
      expect(todosState.length).toBe(2);
      expect(todosState).toEqual(mockTodos);
    });
  });

  describe('updateTodo', () => {
    beforeEach(() => {
      // Set up initial state
      service.getTodos().subscribe();
      httpMock.expectOne('/api/todos').flush(mockTodos);
    });

    it('should update todo via PUT request', () => {
      const todoId = 1;
      const newTitle = 'Updated Title';
      const updatedTodo: Todo = { id: todoId, title: newTitle, completed: false };

      service.updateTodo(todoId, newTitle).subscribe(todo => {
        expect(todo).toEqual(updatedTodo);
      });

      const req = httpMock.expectOne(`/api/todos/${todoId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ title: newTitle });
      req.flush(updatedTodo);
    });

    it('should validate title in updates', () => {
      const todoId = 1;
      const emptyTitle = '';

      service.updateTodo(todoId, emptyTitle).subscribe({
        next: () => fail('Should not succeed with empty title'),
        error: error => expect(error.message).toContain('cannot be empty')
      });

      httpMock.expectNone(`/api/todos/${todoId}`);
    });

    it('should handle 404 error for non-existent todo', () => {
      const todoId = 999;
      const newTitle = 'Updated Title';

      service.updateTodo(todoId, newTitle).subscribe({
        next: () => fail('Should not succeed for non-existent todo'),
        error: error => expect(error.status).toBe(404)
      });

      const req = httpMock.expectOne(`/api/todos/${todoId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('toggleTodo', () => {
    beforeEach(() => {
      // Set up initial state
      service.getTodos().subscribe();
      httpMock.expectOne('/api/todos').flush(mockTodos);
    });

    it('should toggle todo via PUT request', () => {
      const todoId = 1;
      const toggledTodo: Todo = { id: todoId, title: 'Test Todo 1', completed: true };

      service.toggleTodo(todoId).subscribe(todo => {
        expect(todo).toEqual(toggledTodo);
      });

      const req = httpMock.expectOne(`/api/todos/${todoId}/toggle`);
      expect(req.request.method).toBe('PUT');
      req.flush(toggledTodo);
    });

    it('should perform optimistic update and rollback on error', () => {
      const todoId = 1;
      let todosState: Todo[] = [];
      service.todos$.subscribe(todos => todosState = todos);

      // Initially completed = false
      expect(todosState.find(t => t.id === todoId)?.completed).toBe(false);

      service.toggleTodo(todoId).subscribe({
        error: () => {} // Ignore error for this test
      });

      // Should see optimistic update (completed = true)
      expect(todosState.find(t => t.id === todoId)?.completed).toBe(true);

      // API call fails
      const req = httpMock.expectOne(`/api/todos/${todoId}/toggle`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      // Should rollback (completed = false again)
      expect(todosState.find(t => t.id === todoId)?.completed).toBe(false);
    });
  });

  describe('deleteTodo', () => {
    beforeEach(() => {
      // Set up initial state
      service.getTodos().subscribe();
      httpMock.expectOne('/api/todos').flush(mockTodos);
    });

    it('should delete todo via DELETE request', () => {
      const todoId = 1;

      service.deleteTodo(todoId).subscribe();

      const req = httpMock.expectOne(`/api/todos/${todoId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should perform optimistic update and rollback on error', () => {
      const todoId = 1;
      let todosState: Todo[] = [];
      service.todos$.subscribe(todos => todosState = todos);

      // Initially 2 todos
      expect(todosState.length).toBe(2);

      service.deleteTodo(todoId).subscribe({
        error: () => {} // Ignore error for this test
      });

      // Should see optimistic update (1 todo)
      expect(todosState.length).toBe(1);
      expect(todosState.find(t => t.id === todoId)).toBeUndefined();

      // API call fails
      const req = httpMock.expectOne(`/api/todos/${todoId}`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      // Should rollback (2 todos again)
      expect(todosState.length).toBe(2);
      expect(todosState.find(t => t.id === todoId)).toBeDefined();
    });
  });

  describe('clearCompleted', () => {
    beforeEach(() => {
      // Set up initial state with completed todos
      service.getTodos().subscribe();
      httpMock.expectOne('/api/todos').flush(mockTodos);
    });

    it('should clear completed todos via DELETE request', () => {
      service.clearCompleted().subscribe();

      const req = httpMock.expectOne('/api/todos/completed');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should perform optimistic update', () => {
      let todosState: Todo[] = [];
      service.todos$.subscribe(todos => todosState = todos);

      // Initially 2 todos (1 completed)
      expect(todosState.length).toBe(2);
      expect(todosState.filter(t => t.completed).length).toBe(1);

      service.clearCompleted().subscribe();

      // Should see optimistic update (only active todos)
      expect(todosState.length).toBe(1);
      expect(todosState.filter(t => t.completed).length).toBe(0);

      const req = httpMock.expectOne('/api/todos/completed');
      req.flush(null);
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      // Set up initial state
      service.getTodos().subscribe();
      httpMock.expectOne('/api/todos').flush(mockTodos);
    });

    it('should calculate statistics correctly', () => {
      service.getStats().subscribe(stats => {
        expect(stats.total).toBe(2);
        expect(stats.active).toBe(1); // One uncompleted todo
        expect(stats.completed).toBe(1); // One completed todo
      });
    });
  });
});