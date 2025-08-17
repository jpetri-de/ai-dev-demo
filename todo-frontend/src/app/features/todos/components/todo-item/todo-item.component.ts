import { Component, Input, Output, EventEmitter, HostListener, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Todo } from '../../models/todo.interface';
import { TodoService } from '../../../../core/services/todo.service';
import { ErrorService } from '../../../../core/services/error.service';

@Component({
  selector: 'app-todo-item',
  templateUrl: './todo-item.component.html',
  styleUrls: ['./todo-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoItemComponent implements AfterViewInit {
  @Input() todo!: Todo;
  @Output() toggle = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();
  @Output() update = new EventEmitter<{ id: number; title: string }>();

  @ViewChild('editInput', { static: false }) editInput!: ElementRef<HTMLInputElement>;

  isEditing = false;
  isToggling = false;
  isDeleting = false;
  isSaving = false;
  editingTitle = '';
  originalTitle = '';

  constructor(
    private todoService: TodoService,
    private errorService: ErrorService,
    private cdr: ChangeDetectorRef
  ) {}

  get isLoading(): boolean {
    return this.isToggling || this.isDeleting || this.isSaving;
  }

  ngAfterViewInit(): void {
    // Focus input when editing starts
    if (this.isEditing && this.editInput) {
      setTimeout(() => {
        this.editInput.nativeElement.focus();
        this.editInput.nativeElement.select();
      });
    }
  }

  onToggle(): void {
    if (this.isLoading || this.todo.id === undefined) return;
    
    this.isToggling = true;
    this.cdr.markForCheck();
    
    this.todoService.toggleTodo(this.todo.id).subscribe({
      next: () => {
        this.isToggling = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isToggling = false;
        this.cdr.markForCheck();
      }
    });
  }

  onDelete(): void {
    if (this.isLoading || this.todo.id === undefined) return;
    
    this.isDeleting = true;
    this.cdr.markForCheck();
    
    this.todoService.deleteTodo(this.todo.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isDeleting = false;
        this.cdr.markForCheck();
      }
    });
  }

  startEditing(): void {
    if (this.isLoading) return;
    
    this.isEditing = true;
    this.editingTitle = this.todo.title;
    this.originalTitle = this.todo.title;
    this.cdr.markForCheck();
    
    // Enhanced focus management with select
    setTimeout(() => {
      if (this.editInput?.nativeElement) {
        this.editInput.nativeElement.focus();
        this.editInput.nativeElement.select();
      }
    });
  }

  saveEdit(): void {
    if (this.isSaving) return;
    
    const title = this.editingTitle.trim();
    
    // Enhanced validation per specification
    if (!title) {
      // Empty title deletes the todo per specification
      this.onDelete();
      return;
    }
    
    // No change - just exit edit mode
    if (title === this.originalTitle) {
      this.cancelEdit();
      return;
    }
    
    // Validate length
    if (title.length > 500) {
      this.errorService.handleError('Title cannot exceed 500 characters');
      return;
    }
    
    this.isSaving = true;
    this.cdr.markForCheck();
    
    this.todoService.updateTodo(this.todo.id!, title).subscribe({
      next: () => {
        this.isEditing = false;
        this.isSaving = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingTitle = '';
    this.originalTitle = '';
    this.cdr.markForCheck();
  }

  @HostListener('keyup.enter')
  onEnter(): void {
    if (this.isEditing) {
      this.saveEdit();
    }
  }

  @HostListener('keyup.escape')
  onEscape(): void {
    if (this.isEditing) {
      this.cancelEdit();
    }
  }

  onBlur(): void {
    if (this.isEditing) {
      this.saveEdit();
    }
  }
}