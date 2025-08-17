# Feature 14: Frontend-Backend Integration

## Ziel
Vollständige Integration zwischen Angular Frontend und Spring Boot Backend mit optimierter HTTP-Kommunikation.

## Beschreibung
Finalisierung der Frontend-Backend-Integration mit HTTP-Client-Optimierungen, Error-Handling, Retry-Mechanismen und Performance-Verbesserungen. Sicherstellung einer robusten Kommunikation zwischen allen Komponenten.

## Akzeptanzkriterien

### HTTP Client Optimierung
- [ ] Einheitlicher HTTP-Client für alle API-Calls
- [ ] Request/Response Interceptors für Error-Handling
- [ ] Automatic Retry für transiente Fehler
- [ ] Request Caching für Performance

### Error Handling Strategy
- [ ] Globale Error-Handler für HTTP-Fehler
- [ ] User-friendly Fehlermeldungen
- [ ] Offline-Detection und Fallback
- [ ] Network-Timeout Handling

### Performance Optimierung
- [ ] HTTP Request Debouncing
- [ ] Optimistic Updates mit Rollback
- [ ] Efficient Change Detection
- [ ] Memory Leak Prevention

### Security & Validation
- [ ] Input Sanitization für XSS-Schutz
- [ ] Request Validation vor Backend-Calls
- [ ] CORS richtig konfiguriert
- [ ] Error Messages ohne sensitive Daten

## Technische Spezifikationen

### HTTP Client Service (Enhanced)
```typescript
@Injectable()
export class HttpClientService {
  private readonly API_BASE_URL = '/api';
  
  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}
  
  get<T>(endpoint: string, options?: any): Observable<T> {
    return this.http.get<T>(`${this.API_BASE_URL}${endpoint}`, {
      ...options,
      headers: this.getHeaders(options?.headers)
    }).pipe(
      retry(3),
      catchError(this.handleError.bind(this))
    );
  }
  
  post<T>(endpoint: string, body: any, options?: any): Observable<T> {
    return this.http.post<T>(`${this.API_BASE_URL}${endpoint}`, body, {
      ...options,
      headers: this.getHeaders(options?.headers)
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  
  put<T>(endpoint: string, body: any, options?: any): Observable<T> {
    return this.http.put<T>(`${this.API_BASE_URL}${endpoint}`, body, {
      ...options,
      headers: this.getHeaders(options?.headers)
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  
  delete<T>(endpoint: string, options?: any): Observable<T> {
    return this.http.delete<T>(`${this.API_BASE_URL}${endpoint}`, {
      ...options,
      headers: this.getHeaders(options?.headers)
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  
  private getHeaders(customHeaders?: HttpHeaders): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    if (customHeaders) {
      headers = customHeaders;
    }
    
    return headers;
  }
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          break;
        case 404:
          errorMessage = 'Item not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 0:
          errorMessage = 'Unable to connect to server. Please check your connection.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    this.notificationService.showError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
```

### Enhanced TodoService with Integration
```typescript
@Injectable()
export class TodoService {
  private todos$ = new BehaviorSubject<Todo[]>([]);
  private filter$ = new BehaviorSubject<TodoFilter>(TodoFilter.ALL);
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  
  constructor(
    private httpClient: HttpClientService,
    private notificationService: NotificationService
  ) {
    this.initializeOnlineDetection();
    this.loadInitialTodos();
  }
  
  // Network status detection
  private initializeOnlineDetection(): void {
    window.addEventListener('online', () => {
      this.isOnline$.next(true);
      this.syncWithBackend();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
      this.notificationService.showWarning('You are offline. Changes will be saved when connection is restored.');
    });
  }
  
  private loadInitialTodos(): void {
    this.httpClient.get<Todo[]>('/todos').subscribe({
      next: (todos) => {
        this.todos$.next(todos);
      },
      error: (error) => {
        console.error('Failed to load initial todos:', error);
        // Fallback to empty list
        this.todos$.next([]);
      }
    });
  }
  
  createTodo(title: string): Observable<Todo> {
    // Input validation
    const sanitizedTitle = this.sanitizeInput(title);
    if (!this.validateTodoTitle(sanitizedTitle)) {
      return throwError(() => new Error('Invalid todo title'));
    }
    
    // Optimistic update
    const tempTodo: Todo = {
      id: Date.now(), // Temporary ID
      title: sanitizedTitle,
      completed: false
    };
    
    const currentTodos = this.todos$.value;
    this.todos$.next([...currentTodos, tempTodo]);
    
    return this.httpClient.post<Todo>('/todos', { title: sanitizedTitle }).pipe(
      tap((createdTodo) => {
        // Replace temp todo with real todo
        const todos = this.todos$.value.map(todo => 
          todo.id === tempTodo.id ? createdTodo : todo
        );
        this.todos$.next(todos);
      }),
      catchError((error) => {
        // Rollback optimistic update
        const todos = this.todos$.value.filter(todo => todo.id !== tempTodo.id);
        this.todos$.next(todos);
        return throwError(() => error);
      })
    );
  }
  
  updateTodo(id: number, title: string): Observable<Todo> {
    const sanitizedTitle = this.sanitizeInput(title);
    if (!this.validateTodoTitle(sanitizedTitle)) {
      return throwError(() => new Error('Invalid todo title'));
    }
    
    // Optimistic update
    const todos = this.todos$.value;
    const originalTodo = todos.find(t => t.id === id);
    if (!originalTodo) {
      return throwError(() => new Error('Todo not found'));
    }
    
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, title: sanitizedTitle } : todo
    );
    this.todos$.next(updatedTodos);
    
    return this.httpClient.put<Todo>(`/todos/${id}`, { title: sanitizedTitle }).pipe(
      tap((updatedTodo) => {
        const todos = this.todos$.value.map(todo =>
          todo.id === id ? updatedTodo : todo
        );
        this.todos$.next(todos);
      }),
      catchError((error) => {
        // Rollback
        this.todos$.next(todos);
        return throwError(() => error);
      })
    );
  }
  
  // Enhanced methods with validation and error handling
  toggleTodo(id: number): Observable<Todo> {
    const todos = this.todos$.value;
    const originalTodo = todos.find(t => t.id === id);
    if (!originalTodo) {
      return throwError(() => new Error('Todo not found'));
    }
    
    // Optimistic update
    const optimisticTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    this.todos$.next(optimisticTodos);
    
    return this.httpClient.put<Todo>(`/todos/${id}/toggle`, {}).pipe(
      tap((updatedTodo) => {
        const todos = this.todos$.value.map(todo =>
          todo.id === id ? updatedTodo : todo
        );
        this.todos$.next(todos);
      }),
      catchError((error) => {
        // Rollback
        this.todos$.next(todos);
        return throwError(() => error);
      })
    );
  }
  
  private sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Basic XSS protection
      .substring(0, 500); // Enforce length limit
  }
  
  private validateTodoTitle(title: string): boolean {
    return title.length > 0 && title.length <= 500 && title.trim().length > 0;
  }
  
  private syncWithBackend(): void {
    // Sync any pending changes when back online
    this.loadInitialTodos();
  }
  
  // Observable getters for reactive programming
  getTodos(): Observable<Todo[]> {
    return this.todos$.asObservable();
  }
  
  getFilteredTodos(): Observable<Todo[]> {
    return combineLatest([this.todos$, this.filter$]).pipe(
      map(([todos, filter]) => this.applyFilter(todos, filter)),
      debounceTime(100) // Debounce for performance
    );
  }
  
  isOnline(): Observable<boolean> {
    return this.isOnline$.asObservable();
  }
}
```

### Global Error Handler
```typescript
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private notificationService: NotificationService) {}
  
  handleError(error: any): void {
    console.error('Global error:', error);
    
    if (error instanceof HttpErrorResponse) {
      // HTTP errors are handled by HttpClientService
      return;
    }
    
    // Handle other types of errors
    this.notificationService.showError('An unexpected error occurred');
  }
}
```

### Notification Service
```typescript
@Injectable()
export class NotificationService {
  private notifications$ = new Subject<Notification>();
  
  getNotifications(): Observable<Notification> {
    return this.notifications$.asObservable();
  }
  
  showError(message: string): void {
    this.notifications$.next({
      type: 'error',
      message,
      duration: 5000
    });
  }
  
  showWarning(message: string): void {
    this.notifications$.next({
      type: 'warning',
      message,
      duration: 3000
    });
  }
  
  showSuccess(message: string): void {
    this.notifications$.next({
      type: 'success',
      message,
      duration: 2000
    });
  }
}

interface Notification {
  type: 'error' | 'warning' | 'success';
  message: string;
  duration: number;
}
```

### Backend Integration Enhancements
```java
@RestController
@RequestMapping("/api/todos")
@CrossOrigin(origins = "http://localhost:4200")
public class TodoController {
    
    @Autowired
    private TodoService todoService;
    
    @GetMapping
    public ResponseEntity<List<Todo>> getAllTodos() {
        try {
            List<Todo> todos = todoService.getAllTodos();
            return ResponseEntity.ok(todos);
        } catch (Exception e) {
            logger.error("Error fetching todos", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping
    public ResponseEntity<Todo> createTodo(@Valid @RequestBody CreateTodoRequest request) {
        try {
            String sanitizedTitle = sanitizeInput(request.getTitle());
            if (!isValidTitle(sanitizedTitle)) {
                return ResponseEntity.badRequest().build();
            }
            
            Todo todo = todoService.createTodo(sanitizedTitle);
            return ResponseEntity.status(HttpStatus.CREATED).body(todo);
        } catch (Exception e) {
            logger.error("Error creating todo", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Todo> updateTodo(@PathVariable Long id, @Valid @RequestBody UpdateTodoRequest request) {
        try {
            String sanitizedTitle = sanitizeInput(request.getTitle());
            if (!isValidTitle(sanitizedTitle)) {
                return ResponseEntity.badRequest().build();
            }
            
            Todo updatedTodo = todoService.updateTodo(id, sanitizedTitle);
            if (updatedTodo == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(updatedTodo);
        } catch (Exception e) {
            logger.error("Error updating todo with id: " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    private String sanitizeInput(String input) {
        if (input == null) return "";
        return input.trim()
                   .replaceAll("[<>\"']", "") // Basic XSS protection
                   .substring(0, Math.min(input.length(), 500));
    }
    
    private boolean isValidTitle(String title) {
        return title != null && !title.trim().isEmpty() && title.length() <= 500;
    }
}
```

## Testfälle

### HTTP Integration
- [ ] Erfolgreiche API-Calls → Korrekte Response-Verarbeitung
- [ ] 400 Bad Request → User-friendly Fehlermeldung
- [ ] 404 Not Found → Graceful handling
- [ ] 500 Server Error → Retry-Mechanismus
- [ ] Network Error → Offline-Modus aktiviert

### Error Handling
- [ ] Backend offline → Offline-Meldung angezeigt
- [ ] Malformed JSON Response → Fallback-Verhalten
- [ ] Timeout → Retry mit Backoff
- [ ] Concurrent Request Errors → Einzelne Behandlung

### Security
- [ ] XSS-Versuche → Eingabe gesanitized
- [ ] SQL-Injection-Versuche → Backend validiert
- [ ] Oversized Requests → Abgelehnt
- [ ] Invalid Characters → Bereinigt

### Performance
- [ ] 1000+ Todos → Efficient loading
- [ ] Rapid User Actions → Debounced API-Calls
- [ ] Memory Usage → Keine Leaks
- [ ] Change Detection → Optimized

### Offline Scenarios
- [ ] Offline → UI bleibt funktional (read-only)
- [ ] Online wieder → Sync mit Backend
- [ ] Pendant Changes → Conflict resolution

## Definition of Done
- [ ] Einheitlicher HTTP-Client für alle API-Kommunikation
- [ ] Comprehensive Error-Handling mit User-friendly Messages
- [ ] Automatic Retry für transiente Fehler
- [ ] Input Sanitization und Validation
- [ ] Offline-Detection und Fallback-Verhalten
- [ ] Performance-Optimierungen implementiert
- [ ] Security Best Practices befolgt
- [ ] Unit Tests für alle HTTP-Interaktionen
- [ ] Integration Tests mit Mock-Backend
- [ ] Error Scenarios getestet
- [ ] Performance Testing mit großen Datenmengen

## Abhängigkeiten
- Alle Features 01-13 für vollständige Integration

## Nachfolgende Features
- 15-deployment.md (Production-Build und Single JAR-Deployment)