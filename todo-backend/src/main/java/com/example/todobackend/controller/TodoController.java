package com.example.todobackend.controller;

import com.example.todobackend.dto.CreateTodoRequest;
import com.example.todobackend.dto.TodoResponse;
import com.example.todobackend.dto.ToggleAllRequest;
import com.example.todobackend.dto.UpdateTodoRequest;
import com.example.todobackend.service.TodoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for Todo operations.
 * Provides endpoints for CRUD operations on todos.
 * Enhanced for Feature 04-08 combined specification with frontend debugging support.
 * Enhanced for Feature 11: Toggle-All Functionality
 */
@RestController
@RequestMapping("/api/todos")
@Validated
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    /**
     * Retrieves all todos.
     * @return List of all todos
     */
    @GetMapping
    public ResponseEntity<List<TodoResponse>> getAllTodos() {
        List<TodoResponse> todos = todoService.getAllTodos();
        return ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(todos.size()))
                .header("X-Request-ID", UUID.randomUUID().toString())
                .body(todos);
    }

    /**
     * Retrieves a single todo by ID.
     * @param id The todo ID
     * @return The todo if found
     */
    @GetMapping("/{id}")
    public ResponseEntity<TodoResponse> getTodoById(@PathVariable Long id) {
        TodoResponse todo = todoService.getTodoById(id);
        return ResponseEntity.ok()
                .header("X-Todo-ID", id.toString())
                .header("X-Request-ID", UUID.randomUUID().toString())
                .body(todo);
    }

    /**
     * Creates a new todo.
     * @param request The create request
     * @return The created todo
     */
    @PostMapping
    public ResponseEntity<TodoResponse> createTodo(@Valid @RequestBody CreateTodoRequest request) {
        String correlationId = UUID.randomUUID().toString();
        TodoResponse todo = todoService.createTodo(request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .header("X-Created-ID", todo.id().toString())
                .header("X-Correlation-ID", correlationId)
                .header("X-Request-ID", UUID.randomUUID().toString())
                .header("Location", "/api/todos/" + todo.id())
                .body(todo);
    }

    /**
     * Updates an existing todo.
     * 
     * Enhanced for Feature 04-08:
     * - Supports optional title updates (null title means no change)
     * - Empty title after trim deletes the todo (returns 204 No Content)
     * - Supports both title-only and completed-only updates
     * 
     * @param id The todo ID
     * @param request The update request
     * @return The updated todo or 204 if deleted due to empty title
     */
    @PutMapping("/{id}")
    public ResponseEntity<TodoResponse> updateTodo(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTodoRequest request) {
        TodoResponse todo = todoService.updateTodo(id, request);
        
        // If todo was deleted due to empty title, return 204 No Content
        if (todo == null) {
            return ResponseEntity.noContent()
                    .header("X-Deleted-ID", id.toString())
                    .header("X-Request-ID", UUID.randomUUID().toString())
                    .header("X-Debug-Info", "deleted-via-empty-title")
                    .build();
        }
        
        return ResponseEntity.ok()
                .header("X-Updated-ID", id.toString())
                .header("X-Request-ID", UUID.randomUUID().toString())
                .body(todo);
    }

    /**
     * Toggles the completion status of a todo.
     * @param id The todo ID
     * @return The updated todo
     */
    @PutMapping("/{id}/toggle")
    public ResponseEntity<TodoResponse> toggleTodo(@PathVariable Long id) {
        TodoResponse todo = todoService.toggleTodo(id);
        return ResponseEntity.ok()
                .header("X-Toggled-ID", id.toString())
                .header("X-Request-ID", UUID.randomUUID().toString())
                .header("X-Debug-Info", "status=" + todo.completed())
                .body(todo);
    }

    /**
     * Toggles all todos to the specified completion status.
     * Feature 11: Toggle-All Functionality
     * 
     * @param request The toggle all request containing the target completion status
     * @return List of all todos after the toggle operation
     */
    @PutMapping("/toggle-all")
    public ResponseEntity<List<TodoResponse>> toggleAllTodos(@Valid @RequestBody ToggleAllRequest request) {
        String correlationId = UUID.randomUUID().toString();
        List<TodoResponse> todos = todoService.toggleAllTodos(request.completed());
        
        return ResponseEntity.ok()
                .header("X-Toggle-All-Status", request.completed().toString())
                .header("X-Total-Count", String.valueOf(todos.size()))
                .header("X-Correlation-ID", correlationId)
                .header("X-Request-ID", UUID.randomUUID().toString())
                .header("X-Debug-Info", "toggle-all-completed=" + request.completed())
                .body(todos);
    }

    /**
     * Deletes a todo by ID.
     * @param id The todo ID
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Long id) {
        todoService.deleteTodo(id);
        return ResponseEntity.noContent()
                .header("X-Deleted-ID", id.toString())
                .header("X-Request-ID", UUID.randomUUID().toString())
                .build();
    }

    /**
     * Deletes all completed todos.
     * @return No content response
     */
    @DeleteMapping("/completed")
    public ResponseEntity<Void> deleteCompletedTodos() {
        int deletedCount = todoService.deleteCompletedTodos();
        return ResponseEntity.noContent()
                .header("X-Deleted-Count", String.valueOf(deletedCount))
                .header("X-Request-ID", UUID.randomUUID().toString())
                .build();
    }

    /**
     * Gets the count of active todos.
     * @return The count of active todos
     */
    @GetMapping("/count/active")
    public ResponseEntity<Long> getActiveTodoCount() {
        long count = todoService.getActiveTodoCount();
        return ResponseEntity.ok()
                .header("X-Count-Type", "active")
                .header("X-Request-ID", UUID.randomUUID().toString())
                .body(count);
    }

    /**
     * Gets the total count of todos.
     * @return The total count of todos
     */
    @GetMapping("/count/total")
    public ResponseEntity<Integer> getTotalTodoCount() {
        int count = todoService.getTotalTodoCount();
        return ResponseEntity.ok()
                .header("X-Count-Type", "total")
                .header("X-Request-ID", UUID.randomUUID().toString())
                .body(count);
    }
}