import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TodoService } from './todo.service';
import { Todo } from '../../features/todos/models';

describe('TodoService - Alphabetical Sorting', () => {
  let service: TodoService;
  let httpMock: HttpTestingController;

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

  describe('sortTodosAlphabetically', () => {
    it('should sort todos alphabetically by title', (done) => {
      const unsortedTodos: Todo[] = [
        { id: 1, title: 'Zebra', completed: false },
        { id: 2, title: 'Apfel', completed: false },
        { id: 3, title: 'Mango', completed: false }
      ];

      // Load todos into service
      service.getTodos().subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/todos');
      req.flush(unsortedTodos);

      // Check filtered todos are sorted
      service.getFilteredTodos('all').subscribe(todos => {
        expect(todos.map(t => t.title)).toEqual(['Apfel', 'Mango', 'Zebra']);
        done();
      });
    });

    it('should sort case-insensitively', (done) => {
      const unsortedTodos: Todo[] = [
        { id: 1, title: 'zebra', completed: false },
        { id: 2, title: 'Apfel', completed: false },
        { id: 3, title: 'MANGO', completed: false }
      ];

      service.getTodos().subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/todos');
      req.flush(unsortedTodos);

      service.getFilteredTodos('all').subscribe(todos => {
        expect(todos.map(t => t.title)).toEqual(['Apfel', 'MANGO', 'zebra']);
        done();
      });
    });

    it('should handle German umlauts correctly', (done) => {
      const unsortedTodos: Todo[] = [
        { id: 1, title: 'Öl', completed: false },
        { id: 2, title: 'Apfel', completed: false },
        { id: 3, title: 'Äpfel', completed: false },
        { id: 4, title: 'Übung', completed: false }
      ];

      service.getTodos().subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/todos');
      req.flush(unsortedTodos);

      service.getFilteredTodos('all').subscribe(todos => {
        expect(todos.map(t => t.title)).toEqual(['Apfel', 'Äpfel', 'Öl', 'Übung']);
        done();
      });
    });

    it('should sort numbers numerically', (done) => {
      const unsortedTodos: Todo[] = [
        { id: 1, title: 'Todo 10', completed: false },
        { id: 2, title: 'Todo 2', completed: false },
        { id: 3, title: 'Todo 1', completed: false },
        { id: 4, title: 'Todo 20', completed: false }
      ];

      service.getTodos().subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/todos');
      req.flush(unsortedTodos);

      service.getFilteredTodos('all').subscribe(todos => {
        expect(todos.map(t => t.title)).toEqual(['Todo 1', 'Todo 2', 'Todo 10', 'Todo 20']);
        done();
      });
    });

    it('should handle mixed content correctly', (done) => {
      const unsortedTodos: Todo[] = [
        { id: 1, title: '10 Äpfel', completed: false },
        { id: 2, title: '2 Birnen', completed: false },
        { id: 3, title: 'Übung 1', completed: false },
        { id: 4, title: 'übung 10', completed: false }
      ];

      service.getTodos().subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/todos');
      req.flush(unsortedTodos);

      service.getFilteredTodos('all').subscribe(todos => {
        expect(todos.map(t => t.title)).toEqual(['2 Birnen', '10 Äpfel', 'Übung 1', 'übung 10']);
        done();
      });
    });

    it('should maintain sorting in filtered views', (done) => {
      const unsortedTodos: Todo[] = [
        { id: 1, title: 'Zebra Task', completed: true },
        { id: 2, title: 'Apple Task', completed: false },
        { id: 3, title: 'Mango Task', completed: true },
        { id: 4, title: 'Banana Task', completed: false }
      ];

      service.getTodos().subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/todos');
      req.flush(unsortedTodos);

      // Test active filter
      service.getFilteredTodos('active').subscribe(todos => {
        expect(todos.map(t => t.title)).toEqual(['Apple Task', 'Banana Task']);
      });

      // Test completed filter
      service.getFilteredTodos('completed').subscribe(todos => {
        expect(todos.map(t => t.title)).toEqual(['Mango Task', 'Zebra Task']);
        done();
      });
    });

    it('should preserve todo IDs during sorting', (done) => {
      const unsortedTodos: Todo[] = [
        { id: 101, title: 'Zebra', completed: false },
        { id: 202, title: 'Apple', completed: false },
        { id: 303, title: 'Mango', completed: false }
      ];

      service.getTodos().subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/todos');
      req.flush(unsortedTodos);

      service.getFilteredTodos('all').subscribe(todos => {
        expect(todos[0]).toEqual({ id: 202, title: 'Apple', completed: false });
        expect(todos[1]).toEqual({ id: 303, title: 'Mango', completed: false });
        expect(todos[2]).toEqual({ id: 101, title: 'Zebra', completed: false });
        done();
      });
    });

    it('should handle empty todo list', (done) => {
      service.getTodos().subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/todos');
      req.flush([]);

      service.getFilteredTodos('all').subscribe(todos => {
        expect(todos).toEqual([]);
        done();
      });
    });

    it('should handle single todo', (done) => {
      const singleTodo: Todo[] = [
        { id: 1, title: 'Single Task', completed: false }
      ];

      service.getTodos().subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/todos');
      req.flush(singleTodo);

      service.getFilteredTodos('all').subscribe(todos => {
        expect(todos).toEqual(singleTodo);
        done();
      });
    });

    it('should apply sorting to getCurrentlyFilteredTodos', (done) => {
      const unsortedTodos: Todo[] = [
        { id: 1, title: 'Zebra', completed: false },
        { id: 2, title: 'Apple', completed: true },
        { id: 3, title: 'Mango', completed: false }
      ];

      service.getTodos().subscribe();
      const req = httpMock.expectOne('http://localhost:8080/api/todos');
      req.flush(unsortedTodos);

      // Set filter to active
      service.setCurrentFilter('active');

      service.getCurrentlyFilteredTodos().subscribe(todos => {
        expect(todos.map(t => t.title)).toEqual(['Mango', 'Zebra']);
        done();
      });
    });
  });

  describe('Persistence after sorting', () => {
    it('should maintain correct IDs for toggle operations', (done) => {
      const unsortedTodos: Todo[] = [
        { id: 1, title: 'Zebra', completed: false },
        { id: 2, title: 'Apple', completed: false }
      ];

      service.getTodos().subscribe();
      let req = httpMock.expectOne('http://localhost:8080/api/todos');
      req.flush(unsortedTodos);

      // Toggle the first todo in sorted order (which should be "Apple" with id: 2)
      service.getFilteredTodos('all').subscribe(todos => {
        const firstTodo = todos[0];
        expect(firstTodo.title).toBe('Apple');
        expect(firstTodo.id).toBe(2);

        // Toggle this todo
        service.toggleTodo(firstTodo.id).subscribe();
        const toggleReq = httpMock.expectOne('http://localhost:8080/api/todos/2/toggle');
        toggleReq.flush({ id: 2, title: 'Apple', completed: true });
        done();
      });
    });

    it('should maintain correct IDs for update operations', (done) => {
      const unsortedTodos: Todo[] = [
        { id: 1, title: 'Zebra', completed: false },
        { id: 2, title: 'Apple', completed: false }
      ];

      service.getTodos().subscribe();
      let req = httpMock.expectOne('http://localhost:8080/api/todos');
      req.flush(unsortedTodos);

      service.getFilteredTodos('all').subscribe(todos => {
        const firstTodo = todos[0];
        expect(firstTodo.id).toBe(2); // Apple should be first

        // Update this todo
        service.updateTodo(firstTodo.id, 'Apple Updated').subscribe();
        const updateReq = httpMock.expectOne('http://localhost:8080/api/todos/2');
        updateReq.flush({ id: 2, title: 'Apple Updated', completed: false });
        done();
      });
    });

    it('should maintain correct IDs for delete operations', (done) => {
      const unsortedTodos: Todo[] = [
        { id: 1, title: 'Zebra', completed: false },
        { id: 2, title: 'Apple', completed: false },
        { id: 3, title: 'Mango', completed: false }
      ];

      service.getTodos().subscribe();
      let req = httpMock.expectOne('http://localhost:8080/api/todos');
      req.flush(unsortedTodos);

      service.getFilteredTodos('all').subscribe(todos => {
        const lastTodo = todos[2];
        expect(lastTodo.title).toBe('Zebra');
        expect(lastTodo.id).toBe(1);

        // Delete this todo
        service.deleteTodo(lastTodo.id).subscribe();
        const deleteReq = httpMock.expectOne('http://localhost:8080/api/todos/1');
        deleteReq.flush(null);
        done();
      });
    });
  });
});