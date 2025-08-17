import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TodoCounterComponent } from './todo-counter.component';
import { TodoService } from '../../../../core/services/todo.service';

describe('TodoCounterComponent', () => {
  let component: TodoCounterComponent;
  let fixture: ComponentFixture<TodoCounterComponent>;
  let mockTodoService: jasmine.SpyObj<TodoService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('TodoService', ['getActiveCount']);

    await TestBed.configureTestingModule({
      declarations: [TodoCounterComponent],
      providers: [
        { provide: TodoService, useValue: spy }
      ]
    }).compileComponents();

    mockTodoService = TestBed.inject(TodoService) as jasmine.SpyObj<TodoService>;
  });

  beforeEach(() => {
    // Set default return value before creating fixture
    mockTodoService.getActiveCount.and.returnValue(of(0));
    fixture = TestBed.createComponent(TodoCounterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    mockTodoService.getActiveCount.and.returnValue(of(0));
    expect(component).toBeTruthy();
  });

  it('should display correct count and pluralization for 0 items', () => {
    mockTodoService.getActiveCount.and.returnValue(of(0));
    fixture.detectChanges();
    
    const element = fixture.nativeElement.querySelector('.todo-count');
    expect(element.textContent).toContain('0');
    expect(element.textContent).toContain('items left');
  });

  it('should display correct count and pluralization for 1 item', () => {
    // Create a new fixture with different mock value
    mockTodoService.getActiveCount.and.returnValue(of(1));
    const newFixture = TestBed.createComponent(TodoCounterComponent);
    newFixture.detectChanges();
    
    const element = newFixture.nativeElement.querySelector('.todo-count');
    expect(element.textContent).toContain('1');
    expect(element.textContent).toContain('item left');
  });

  it('should display correct count and pluralization for multiple items', () => {
    mockTodoService.getActiveCount.and.returnValue(of(5));
    const newFixture = TestBed.createComponent(TodoCounterComponent);
    newFixture.detectChanges();
    
    const element = newFixture.nativeElement.querySelector('.todo-count');
    expect(element.textContent).toContain('5');
    expect(element.textContent).toContain('items left');
  });

  it('should have proper aria-label for accessibility', () => {
    mockTodoService.getActiveCount.and.returnValue(of(3));
    const newFixture = TestBed.createComponent(TodoCounterComponent);
    newFixture.detectChanges();
    
    const element = newFixture.nativeElement.querySelector('.todo-count');
    expect(element.getAttribute('aria-label')).toContain('items left');
  });
});