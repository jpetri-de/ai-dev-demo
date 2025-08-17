import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Todo, TodoStats } from '../../features/todos/models/todo.interface';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly apiUrl = '/api/todos';
  private todosSubject = new BehaviorSubject<Todo[]>([]);
  public todos$ = this.todosSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all todos
  getTodos(): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.apiUrl).pipe(
      map(todos => {
        this.updateTodos(todos);
        return todos;
      })
    );
  }

  // Create new todo
  createTodo(title: string): Observable<Todo> {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new Error('Todo title cannot be empty');
    }
    
    const newTodo = { title: trimmedTitle, completed: false };
    return this.http.post<Todo>(this.apiUrl, newTodo).pipe(
      map(todo => {
        const currentTodos = this.todosSubject.value;
        this.updateTodos([...currentTodos, todo]);
        return todo;
      })
    );
  }

  // Update todo
  updateTodo(id: number, updates: Partial<Todo>): Observable<Todo> {
    return this.http.put<Todo>(`${this.apiUrl}/${id}`, updates).pipe(
      map(updatedTodo => {
        const currentTodos = this.todosSubject.value;
        const updatedTodos = currentTodos.map(todo => 
          todo.id === id ? updatedTodo : todo
        );
        this.updateTodos(updatedTodos);
        return updatedTodo;
      })
    );
  }

  // Delete todo
  deleteTodo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      map(() => {
        const currentTodos = this.todosSubject.value;
        const filteredTodos = currentTodos.filter(todo => todo.id !== id);
        this.updateTodos(filteredTodos);
      })
    );
  }

  // Toggle todo completion status
  toggleTodo(id: number): Observable<Todo> {
    return this.http.put<Todo>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      map(updatedTodo => {
        const currentTodos = this.todosSubject.value;
        const updatedTodos = currentTodos.map(todo => 
          todo.id === id ? updatedTodo : todo
        );
        this.updateTodos(updatedTodos);
        return updatedTodo;
      })
    );
  }

  // Toggle all todos
  toggleAllTodos(completed: boolean): Observable<Todo[]> {
    return this.http.put<Todo[]>(`${this.apiUrl}/toggle-all`, { completed }).pipe(
      map(updatedTodos => {
        this.updateTodos(updatedTodos);
        return updatedTodos;
      })
    );
  }

  // Clear completed todos
  clearCompleted(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/completed`).pipe(
      map(() => {
        const currentTodos = this.todosSubject.value;
        const activeTodos = currentTodos.filter(todo => !todo.completed);
        this.updateTodos(activeTodos);
      })
    );
  }

  // Get todo statistics
  getStats(): Observable<TodoStats> {
    return this.todos$.pipe(
      map(todos => {
        const total = todos.length;
        const completed = todos.filter(todo => todo.completed).length;
        const active = total - completed;
        return { total, active, completed };
      })
    );
  }

  // Private method to update todos state
  private updateTodos(todos: Todo[]): void {
    this.todosSubject.next(todos);
  }
}