# Framework Adaptation Guide

Dieses Dokument bietet eine Übersetzungstabelle für die Implementierung der TodoMVC-Anwendung in verschiedenen Frontend-Frameworks. Die Specs verwenden generische Beispiele, die mit diesem Guide für das gewählte Framework angepasst werden können.

## Component Decorators & Setup

### Angular
```typescript
@Component({
  selector: 'app-todo',
  templateUrl: './todo.component.html'
})
export class TodoComponent { }
```

### Vue
```vue
<script setup lang="ts">
// Component logic here
</script>

<template>
  <!-- Template here -->
</template>
```

### React
```typescript
export const TodoComponent: React.FC = () => {
  return <div>...</div>
}
```

## Service/Store Pattern

### Angular
```typescript
@Injectable({ providedIn: 'root' })
export class TodoService {
  private todos$ = new BehaviorSubject<Todo[]>([]);
}
```

### Vue (Pinia)
```typescript
export const useTodoStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([]);
  return { todos };
})
```

### React (Context/Redux)
```typescript
const TodoContext = React.createContext<TodoState>(initialState);
// oder mit Redux Toolkit
const todoSlice = createSlice({ name: 'todos', initialState, reducers: {} });
```

## Data Binding

### Two-Way Binding

#### Angular
```html
<input [(ngModel)]="newTodoTitle">
```

#### Vue
```html
<input v-model="newTodoTitle">
```

#### React
```jsx
<input value={newTodoTitle} onChange={(e) => setNewTodoTitle(e.target.value)}>
```

## Event Handling

### Enter Key Event

#### Angular
```html
<input (keyup.enter)="createTodo()">
```

#### Vue
```html
<input @keyup.enter="createTodo">
```

#### React
```jsx
<input onKeyUp={(e) => e.key === 'Enter' && createTodo()}>
```

## List Rendering

### Angular
```html
<li *ngFor="let todo of todos">{{ todo.title }}</li>
```

### Vue
```html
<li v-for="todo in todos" :key="todo.id">{{ todo.title }}</li>
```

### React
```jsx
{todos.map(todo => <li key={todo.id}>{todo.title}</li>)}
```

## Conditional Rendering

### Angular
```html
<div *ngIf="loading">Loading...</div>
```

### Vue
```html
<div v-if="loading">Loading...</div>
```

### React
```jsx
{loading && <div>Loading...</div>}
```

## Class Binding

### Angular
```html
<li [class.completed]="todo.completed">
```

### Vue
```html
<li :class="{ completed: todo.completed }">
```

### React
```jsx
<li className={todo.completed ? 'completed' : ''}>
```

## HTTP Client

### Angular
```typescript
constructor(private http: HttpClient) {}
this.http.get<Todo[]>('/api/todos')
```

### Vue (Axios/Fetch)
```typescript
import axios from 'axios'
axios.get<Todo[]>('/api/todos')
// oder
fetch('/api/todos').then(r => r.json())
```

### React (Axios/Fetch)
```typescript
useEffect(() => {
  fetch('/api/todos')
    .then(r => r.json())
    .then(setTodos)
}, [])
```

## Reactive State Management

### Angular (RxJS)
```typescript
todos$ = new BehaviorSubject<Todo[]>([]);
filteredTodos$ = this.todos$.pipe(
  map(todos => todos.filter(t => !t.completed))
);
```

### Vue (Composition API)
```typescript
const todos = ref<Todo[]>([]);
const filteredTodos = computed(() => 
  todos.value.filter(t => !t.completed)
);
```

### React (Hooks)
```typescript
const [todos, setTodos] = useState<Todo[]>([]);
const filteredTodos = useMemo(() => 
  todos.filter(t => !t.completed), [todos]
);
```

## Lifecycle Hooks

### Component Mount

#### Angular
```typescript
ngOnInit() { this.loadTodos(); }
```

#### Vue
```typescript
onMounted(() => { loadTodos(); })
```

#### React
```typescript
useEffect(() => { loadTodos(); }, [])
```

### Component Unmount

#### Angular
```typescript
ngOnDestroy() { this.subscription.unsubscribe(); }
```

#### Vue
```typescript
onUnmounted(() => { cleanup(); })
```

#### React
```typescript
useEffect(() => {
  return () => { cleanup(); }
}, [])
```

## Dependency Injection

### Angular
```typescript
constructor(
  private todoService: TodoService,
  private router: Router
) {}
```

### Vue
```typescript
const todoStore = useTodoStore();
const router = useRouter();
```

### React
```typescript
const todoContext = useContext(TodoContext);
const navigate = useNavigate();
```

## Form Handling

### Angular
```typescript
import { FormsModule } from '@angular/forms';
[(ngModel)]="todo.title"
```

### Vue
```typescript
v-model="todo.title"
// oder mit Composition API
const title = ref('');
```

### React
```typescript
const [title, setTitle] = useState('');
<input value={title} onChange={e => setTitle(e.target.value)} />
```

## Build Configuration

### Development Server

#### Angular
```bash
ng serve --proxy-config proxy.conf.json
```

#### Vue (Vite)
```bash
npm run dev  # mit vite.config.js proxy
```

#### React
```bash
npm start  # mit setupProxy.js
```

### Production Build

#### Angular
```bash
ng build --configuration production
```

#### Vue
```bash
npm run build
```

#### React
```bash
npm run build
```

## Testing

### Unit Tests

#### Angular
```typescript
TestBed.configureTestingModule({
  declarations: [TodoComponent]
});
```

#### Vue
```typescript
import { mount } from '@vue/test-utils'
mount(TodoComponent)
```

#### React
```typescript
import { render } from '@testing-library/react'
render(<TodoComponent />)
```

## Project Structure

### Angular
```
src/
├── app/
│   ├── components/
│   ├── services/
│   ├── models/
│   └── app.module.ts
```

### Vue
```
src/
├── components/
├── stores/
├── types/
├── router/
└── main.ts
```

### React
```
src/
├── components/
├── contexts/
├── types/
├── services/
└── index.tsx
```

## Verwendung in den Specs

Wenn in den Specs Code-Beispiele mit `@Component`, `@Injectable` oder Angular-spezifischer Syntax auftauchen, nutzen Sie diese Tabelle zur Übersetzung in Ihr gewähltes Framework.

Die Specs sind bewusst technologie-neutral gehalten, sodass die gleichen Features in Angular, Vue oder React implementiert werden können.