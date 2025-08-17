import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TodoCounterComponent } from './todo-counter.component';
import { TodoService } from '../../../../core/services/todo.service';

describe('TodoCounterComponent', () => {
  let component: TodoCounterComponent;
  let fixture: ComponentFixture<TodoCounterComponent>;
  let mockTodoService: jasmine.SpyObj<TodoService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('TodoService', ['getStats']);

    await TestBed.configureTestingModule({
      declarations: [TodoCounterComponent],
      providers: [
        { provide: TodoService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoCounterComponent);
    component = fixture.componentInstance;
    mockTodoService = TestBed.inject(TodoService) as jasmine.SpyObj<TodoService>;
  });

  it('should create', () => {
    mockTodoService.getStats.and.returnValue(of({ total: 0, active: 0, completed: 0 }));
    expect(component).toBeTruthy();
  });

  it('should display singular item for 1 active todo', () => {
    mockTodoService.getStats.and.returnValue(of({ total: 1, active: 1, completed: 0 }));
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('1 item left');
  });

  it('should display plural items for multiple active todos', () => {
    mockTodoService.getStats.and.returnValue(of({ total: 3, active: 3, completed: 0 }));
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('3 items left');
  });

  it('should display plural items for 0 active todos', () => {
    mockTodoService.getStats.and.returnValue(of({ total: 2, active: 0, completed: 2 }));
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('0 items left');
  });
});