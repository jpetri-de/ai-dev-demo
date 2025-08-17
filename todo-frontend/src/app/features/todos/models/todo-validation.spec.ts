import { TodoValidator } from './todo-validation';
import { Todo } from './todo.interface';

describe('TodoValidator', () => {
  describe('validateTitle', () => {
    it('should return no errors for valid title', () => {
      const validTitle = 'Valid Todo Title';
      const errors = TodoValidator.validateTitle(validTitle);
      expect(errors.length).toBe(0);
    });

    it('should return error for empty title', () => {
      const emptyTitle = '';
      const errors = TodoValidator.validateTitle(emptyTitle);
      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe('title');
      expect(errors[0].message).toBe('Todo title cannot be empty');
    });

    it('should return error for whitespace-only title', () => {
      const whitespaceTitle = '   ';
      const errors = TodoValidator.validateTitle(whitespaceTitle);
      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe('title');
      expect(errors[0].message).toBe('Todo title cannot be empty');
    });

    it('should return error for title exceeding max length', () => {
      const longTitle = 'a'.repeat(501);
      const errors = TodoValidator.validateTitle(longTitle);
      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe('title');
      expect(errors[0].message).toBe('Todo title cannot exceed 500 characters');
    });

    it('should accept title at max length', () => {
      const maxLengthTitle = 'a'.repeat(500);
      const errors = TodoValidator.validateTitle(maxLengthTitle);
      expect(errors.length).toBe(0);
    });

    it('should trim title before validation', () => {
      const titleWithSpaces = '  Valid Title  ';
      const errors = TodoValidator.validateTitle(titleWithSpaces);
      expect(errors.length).toBe(0);
    });

    it('should return error if trimmed title becomes empty', () => {
      const onlySpacesTitle = '   ';
      const errors = TodoValidator.validateTitle(onlySpacesTitle);
      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe('Todo title cannot be empty');
    });

    it('should return error if trimmed title exceeds max length', () => {
      const titleWithSpaces = '  ' + 'a'.repeat(499) + '  '; // 499 chars + 4 spaces
      const errors = TodoValidator.validateTitle(titleWithSpaces);
      expect(errors.length).toBe(0); // Should be valid after trimming

      const tooLongWithSpaces = '  ' + 'a'.repeat(501) + '  '; // 501 chars + 4 spaces
      const errorsLong = TodoValidator.validateTitle(tooLongWithSpaces);
      expect(errorsLong.length).toBe(1);
      expect(errorsLong[0].message).toBe('Todo title cannot exceed 500 characters');
    });
  });

  describe('validateTodo', () => {
    it('should return no errors for valid todo', () => {
      const validTodo: Partial<Todo> = {
        title: 'Valid Todo Title',
        completed: false
      };
      const errors = TodoValidator.validateTodo(validTodo);
      expect(errors.length).toBe(0);
    });

    it('should return title errors when title is invalid', () => {
      const invalidTodo: Partial<Todo> = {
        title: '',
        completed: false
      };
      const errors = TodoValidator.validateTodo(invalidTodo);
      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe('title');
      expect(errors[0].message).toBe('Todo title cannot be empty');
    });

    it('should not validate title if not provided', () => {
      const todoWithoutTitle: Partial<Todo> = {
        completed: true
      };
      const errors = TodoValidator.validateTodo(todoWithoutTitle);
      expect(errors.length).toBe(0);
    });

    it('should validate title if provided even when undefined explicitly', () => {
      const todoWithUndefinedTitle: Partial<Todo> = {
        title: undefined,
        completed: true
      };
      const errors = TodoValidator.validateTodo(todoWithUndefinedTitle);
      expect(errors.length).toBe(0);
    });

    it('should handle multiple validation errors', () => {
      const invalidTodo: Partial<Todo> = {
        title: 'a'.repeat(501), // Too long
        completed: false
      };
      const errors = TodoValidator.validateTodo(invalidTodo);
      expect(errors.length).toBe(1);
      expect(errors[0].field).toBe('title');
      expect(errors[0].message).toBe('Todo title cannot exceed 500 characters');
    });
  });

  describe('isValidTitle', () => {
    it('should return true for valid title', () => {
      const validTitle = 'Valid Todo Title';
      expect(TodoValidator.isValidTitle(validTitle)).toBe(true);
    });

    it('should return false for empty title', () => {
      const emptyTitle = '';
      expect(TodoValidator.isValidTitle(emptyTitle)).toBe(false);
    });

    it('should return false for whitespace-only title', () => {
      const whitespaceTitle = '   ';
      expect(TodoValidator.isValidTitle(whitespaceTitle)).toBe(false);
    });

    it('should return false for title exceeding max length', () => {
      const longTitle = 'a'.repeat(501);
      expect(TodoValidator.isValidTitle(longTitle)).toBe(false);
    });

    it('should return true for title at max length', () => {
      const maxLengthTitle = 'a'.repeat(500);
      expect(TodoValidator.isValidTitle(maxLengthTitle)).toBe(true);
    });

    it('should handle trimming correctly', () => {
      const titleWithSpaces = '  Valid Title  ';
      expect(TodoValidator.isValidTitle(titleWithSpaces)).toBe(true);
    });
  });

  describe('constants', () => {
    it('should have correct MAX_TITLE_LENGTH', () => {
      expect(TodoValidator.MAX_TITLE_LENGTH).toBe(500);
    });

    it('should have correct MIN_TITLE_LENGTH', () => {
      expect(TodoValidator.MIN_TITLE_LENGTH).toBe(1);
    });
  });
});