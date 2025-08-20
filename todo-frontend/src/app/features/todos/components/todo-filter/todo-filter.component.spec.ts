import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TodoFilterComponent } from './todo-filter.component';
import { TodoService } from '../../../../core/services/todo.service';

describe('TodoFilterComponent', () => {
  let component: TodoFilterComponent;
  let fixture: ComponentFixture<TodoFilterComponent>;
  let mockTodoService: jasmine.SpyObj<TodoService>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    const todoServiceSpy = jasmine.createSpyObj('TodoService', ['getFilteredTodos', 'getCurrentFilter', 'setCurrentFilter']);
    todoServiceSpy.getCurrentFilter.and.returnValue(of('all'));
    mockActivatedRoute = {
      url: of([]),
      fragment: of(null)
    };

    await TestBed.configureTestingModule({
      declarations: [TodoFilterComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: TodoService, useValue: todoServiceSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoFilterComponent);
    component = fixture.componentInstance;
    mockTodoService = TestBed.inject(TodoService) as jasmine.SpyObj<TodoService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with all filter', (done) => {
    fixture.detectChanges();
    component.currentFilter$.subscribe(filter => {
      expect(filter).toBe('all');
      done();
    });
  });

  it('should update filter from route', () => {
    mockActivatedRoute.url = of([{ path: 'active' }]);
    mockTodoService.setCurrentFilter.and.stub();
    component.ngOnInit();
    expect(mockTodoService.setCurrentFilter).toHaveBeenCalledWith('active');
  });

  it('should have correct filter options', () => {
    expect(component.filterOptions).toEqual([
      { type: 'all', label: 'All', route: '/' },
      { type: 'active', label: 'Active', route: '/active' },
      { type: 'completed', label: 'Completed', route: '/completed' }
    ]);
  });
});