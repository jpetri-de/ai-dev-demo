import { Component, Input, Output, EventEmitter, HostListener, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Todo } from '../../models/todo.interface';

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
  editingTitle = '';

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
    if (this.todo.id !== undefined) {
      this.toggle.emit(this.todo.id);
    }
  }

  onDelete(): void {
    if (this.todo.id !== undefined) {
      this.delete.emit(this.todo.id);
    }
  }

  startEditing(): void {
    this.isEditing = true;
    this.editingTitle = this.todo.title;
    // Use setTimeout to ensure the input is rendered before focusing
    setTimeout(() => {
      if (this.editInput) {
        this.editInput.nativeElement.focus();
        this.editInput.nativeElement.select();
      }
    });
  }

  saveEdit(): void {
    const title = this.editingTitle.trim();
    if (title && title !== this.todo.title && this.todo.id !== undefined) {
      this.update.emit({ id: this.todo.id, title });
    } else if (!title && this.todo.id !== undefined) {
      // Delete todo if title is empty
      this.delete.emit(this.todo.id);
    }
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingTitle = '';
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