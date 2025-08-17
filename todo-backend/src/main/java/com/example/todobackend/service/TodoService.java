package com.example.todobackend.service;

import com.example.todobackend.dto.CreateTodoRequest;
import com.example.todobackend.dto.TodoResponse;
import com.example.todobackend.dto.UpdateTodoRequest;
import com.example.todobackend.exception.TodoNotFoundException;
import com.example.todobackend.mapper.TodoMapper;
import com.example.todobackend.model.Todo;
import com.example.todobackend.security.SecurityUtils;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Business service for Todo operations.
 * Contains validation logic and coordinates between controller and storage layers.
 * 
 * Enhanced for Feature 04-08 combined specification:
 * - Support for optional title updates in updateTodo method
 * - Empty title after trim deletes the todo (as per specification)
 * - Optimized for sub-50ms response times for optimistic updates
 * 
 * Enhanced for Feature 11: Toggle-All Functionality
 * Enhanced for Feature 14: Enhanced Security with input sanitization
 */
@Service
public class TodoService {
    
    private final TodoStorageService storageService;
    private final TodoMapper mapper;
    private final SecurityUtils securityUtils;

    public TodoService(TodoStorageService storageService, TodoMapper mapper, SecurityUtils securityUtils) {
        this.storageService = storageService;
        this.mapper = mapper;
        this.securityUtils = securityUtils;
    }

    /**
     * Retrieves all todos.
     * @return List of todo responses
     */
    public List<TodoResponse> getAllTodos() {
        return storageService.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    /**
     * Retrieves a single todo by ID.
     * @param id The todo ID
     * @return The todo response
     * @throws TodoNotFoundException if todo not found
     */
    public TodoResponse getTodoById(Long id) {
        Todo todo = storageService.findById(id)
                .orElseThrow(() -> new TodoNotFoundException("Todo not found with id: " + id));
        return mapper.toResponse(todo);
    }

    /**
     * Creates a new todo.
     * Enhanced for Feature 14: Input sanitization and security validation
     * 
     * @param request The create request
     * @return The created todo response
     * @throws IllegalArgumentException if title is invalid after sanitization
     */
    public TodoResponse createTodo(CreateTodoRequest request) {
        // Security check for potential threats
        if (securityUtils.containsSecurityThreats(request.title())) {
            throw new IllegalArgumentException("Title contains potentially unsafe content");
        }
        
        // Sanitize and validate the title
        String sanitizedTitle = securityUtils.sanitizeAndValidateTodoTitle(request.title());

        Todo todo = new Todo(sanitizedTitle);
        Todo savedTodo = storageService.save(todo);
        return mapper.toResponse(savedTodo);
    }

    /**
     * Updates an existing todo.
     * 
     * Enhanced for Feature 04-08:
     * - Title is optional - when null, only completed status is updated
     * - When title is provided but empty after trim, todo is deleted
     * - Supports both title-only and completed-only updates
     * 
     * Enhanced for Feature 14: Input sanitization and security validation
     * 
     * @param id The todo ID
     * @param request The update request
     * @return The updated todo response, or null if todo was deleted
     * @throws TodoNotFoundException if todo not found
     * @throws IllegalArgumentException if title contains security threats
     */
    public TodoResponse updateTodo(Long id, UpdateTodoRequest request) {
        Todo todo = storageService.findById(id)
                .orElseThrow(() -> new TodoNotFoundException("Todo not found with id: " + id));

        // Handle title update with security validation
        if (request.title() != null) {
            // Security check for potential threats
            if (securityUtils.containsSecurityThreats(request.title())) {
                throw new IllegalArgumentException("Title contains potentially unsafe content");
            }
            
            // Sanitize the title first
            String sanitizedTitle = securityUtils.sanitizeInput(request.title());
            
            if (sanitizedTitle.trim().isEmpty()) {
                // As per Feature 04-08 specification: empty title deletes the todo
                storageService.deleteById(id);
                return null; // Indicate deletion occurred
            }
            
            // Additional validation after sanitization
            if (!securityUtils.isValidTodoTitle(sanitizedTitle)) {
                throw new IllegalArgumentException("Title is invalid after sanitization");
            }
            
            todo.updateTitle(sanitizedTitle);
        }
        
        // Handle completed status update
        if (request.completed() != null) {
            todo.setCompleted(request.completed());
        }

        Todo updatedTodo = storageService.save(todo);
        return mapper.toResponse(updatedTodo);
    }

    /**
     * Toggles the completion status of a todo.
     * @param id The todo ID
     * @return The updated todo response
     * @throws TodoNotFoundException if todo not found
     */
    public TodoResponse toggleTodo(Long id) {
        Todo todo = storageService.findById(id)
                .orElseThrow(() -> new TodoNotFoundException("Todo not found with id: " + id));

        todo.toggleCompleted();
        Todo updatedTodo = storageService.save(todo);
        return mapper.toResponse(updatedTodo);
    }

    /**
     * Deletes a todo by ID.
     * @param id The todo ID
     * @throws TodoNotFoundException if todo not found
     */
    public void deleteTodo(Long id) {
        if (!storageService.deleteById(id)) {
            throw new TodoNotFoundException("Todo not found with id: " + id);
        }
    }

    /**
     * Deletes all completed todos.
     * @return The number of todos deleted
     */
    public int deleteCompletedTodos() {
        return storageService.deleteCompleted();
    }

    /**
     * Toggles all todos to the specified completion status.
     * Feature 11: Toggle-All Functionality
     * 
     * @param completed The target completion status for all todos
     * @return List of all todos after the operation
     */
    public List<TodoResponse> toggleAllTodos(boolean completed) {
        storageService.toggleAllTodos(completed);
        // Return all todos after the operation
        return getAllTodos();
    }

    /**
     * Gets the count of active (non-completed) todos.
     * @return The count of active todos
     */
    public long getActiveTodoCount() {
        return storageService.findAll().stream()
                .filter(todo -> !todo.isCompleted())
                .count();
    }

    /**
     * Gets the total count of todos.
     * @return The total count of todos
     */
    public int getTotalTodoCount() {
        return storageService.count();
    }
}