import { TodoValidationError, Todo } from './todo.interface';

export class TodoValidator {
  static readonly MAX_TITLE_LENGTH = 500;
  static readonly MIN_TITLE_LENGTH = 1;

  static validateTitle(title: string): TodoValidationError[] {
    const errors: TodoValidationError[] = [];
    const trimmedTitle = title.trim();

    if (!trimmedTitle || trimmedTitle.length < this.MIN_TITLE_LENGTH) {
      errors.push({
        field: 'title',
        message: 'Todo title cannot be empty'
      });
    }

    if (trimmedTitle.length > this.MAX_TITLE_LENGTH) {
      errors.push({
        field: 'title',
        message: `Todo title cannot exceed ${this.MAX_TITLE_LENGTH} characters`
      });
    }

    return errors;
  }

  static validateTodo(todo: Partial<Todo>): TodoValidationError[] {
    const errors: TodoValidationError[] = [];

    if (todo.title !== undefined) {
      errors.push(...this.validateTitle(todo.title));
    }

    return errors;
  }

  static isValidTitle(title: string): boolean {
    return this.validateTitle(title).length === 0;
  }
}