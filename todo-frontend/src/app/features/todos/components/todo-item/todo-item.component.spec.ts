import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../../shared/shared.module';
import { TodoItemComponent } from './todo-item.component';
import { Todo } from '../../models/todo.interface';

describe('TodoItemComponent', () => {
  let component: TodoItemComponent;
  let fixture: ComponentFixture<TodoItemComponent>;

  const mockTodo: Todo = {
    id: 1,
    title: 'Test Todo',
    completed: false
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TodoItemComponent],
      imports: [SharedModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoItemComponent);
    component = fixture.componentInstance;
    component.todo = mockTodo;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit toggle event', () => {
    spyOn(component.toggle, 'emit');
    
    component.onToggle();
    
    expect(component.toggle.emit).toHaveBeenCalledWith(1);
  });

  it('should emit delete event', () => {
    spyOn(component.delete, 'emit');
    
    component.onDelete();
    
    expect(component.delete.emit).toHaveBeenCalledWith(1);
  });

  it('should start editing', () => {
    component.startEditing();
    
    expect(component.isEditing).toBe(true);
    expect(component.editingTitle).toBe(mockTodo.title);
  });

  it('should save edit with valid title', () => {
    spyOn(component.update, 'emit');
    component.isEditing = true;
    component.editingTitle = 'Updated Title';
    
    component.saveEdit();
    
    expect(component.update.emit).toHaveBeenCalledWith({
      id: 1,
      title: 'Updated Title'
    });
    expect(component.isEditing).toBe(false);
  });

  it('should delete todo when title is empty', () => {
    spyOn(component.delete, 'emit');
    component.isEditing = true;
    component.editingTitle = '';
    
    component.saveEdit();
    
    expect(component.delete.emit).toHaveBeenCalledWith(1);
    expect(component.isEditing).toBe(false);
  });

  it('should cancel edit without changes when title is unchanged', () => {
    component.isEditing = true;
    component.editingTitle = mockTodo.title;
    
    component.saveEdit();
    
    expect(component.isEditing).toBe(false);
  });

  it('should cancel edit', () => {
    component.isEditing = true;
    component.editingTitle = 'Some edit';
    
    component.cancelEdit();
    
    expect(component.isEditing).toBe(false);
    expect(component.editingTitle).toBe('');
  });

  it('should save edit on Enter key', () => {
    spyOn(component, 'saveEdit');
    component.isEditing = true;
    
    component.onEnter();
    
    expect(component.saveEdit).toHaveBeenCalled();
  });

  it('should cancel edit on Escape key', () => {
    spyOn(component, 'cancelEdit');
    component.isEditing = true;
    
    component.onEscape();
    
    expect(component.cancelEdit).toHaveBeenCalled();
  });

  it('should save edit on blur', () => {
    spyOn(component, 'saveEdit');
    component.isEditing = true;
    
    component.onBlur();
    
    expect(component.saveEdit).toHaveBeenCalled();
  });
});