package com.example.todobackend.controller;

import com.example.todobackend.dto.CreateTodoRequest;
import com.example.todobackend.dto.TodoResponse;
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
 * Enhanced for Feature 03 with frontend debugging support.
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
     * @param id The todo ID
     * @param request The update request
     * @return The updated todo
     */
    @PutMapping("/{id}")
    public ResponseEntity<TodoResponse> updateTodo(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTodoRequest request) {
        TodoResponse todo = todoService.updateTodo(id, request);
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