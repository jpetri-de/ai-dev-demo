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

/**
 * REST controller for Todo operations.
 * Provides endpoints for CRUD operations on todos.
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
        return ResponseEntity.ok(todos);
    }

    /**
     * Creates a new todo.
     * @param request The create request
     * @return The created todo
     */
    @PostMapping
    public ResponseEntity<TodoResponse> createTodo(@Valid @RequestBody CreateTodoRequest request) {
        TodoResponse todo = todoService.createTodo(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(todo);
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
        return ResponseEntity.ok(todo);
    }

    /**
     * Toggles the completion status of a todo.
     * @param id The todo ID
     * @return The updated todo
     */
    @PutMapping("/{id}/toggle")
    public ResponseEntity<TodoResponse> toggleTodo(@PathVariable Long id) {
        TodoResponse todo = todoService.toggleTodo(id);
        return ResponseEntity.ok(todo);
    }

    /**
     * Deletes a todo by ID.
     * @param id The todo ID
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Long id) {
        todoService.deleteTodo(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Deletes all completed todos.
     * @return No content response
     */
    @DeleteMapping("/completed")
    public ResponseEntity<Void> deleteCompletedTodos() {
        todoService.deleteCompletedTodos();
        return ResponseEntity.noContent().build();
    }

    /**
     * Gets the count of active todos.
     * @return The count of active todos
     */
    @GetMapping("/count/active")
    public ResponseEntity<Long> getActiveTodoCount() {
        long count = todoService.getActiveTodoCount();
        return ResponseEntity.ok(count);
    }

    /**
     * Gets the total count of todos.
     * @return The total count of todos
     */
    @GetMapping("/count/total")
    public ResponseEntity<Integer> getTotalTodoCount() {
        int count = todoService.getTotalTodoCount();
        return ResponseEntity.ok(count);
    }
}