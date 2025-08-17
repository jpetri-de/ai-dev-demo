package com.example.todobackend.service;

import com.example.todobackend.model.Todo;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Thread-safe in-memory storage service for Todo entities.
 * Uses synchronized collections and atomic operations for thread safety.
 */
@Service
public class TodoStorageService {
    
    private final List<Todo> todos = Collections.synchronizedList(new ArrayList<>());
    private final AtomicLong idCounter = new AtomicLong(1);

    /**
     * Retrieves all todos.
     * @return A copy of all todos for thread safety
     */
    public List<Todo> findAll() {
        synchronized (todos) {
            return new ArrayList<>(todos);
        }
    }

    /**
     * Finds a todo by ID.
     * @param id The todo ID
     * @return Optional containing the todo if found
     */
    public Optional<Todo> findById(Long id) {
        synchronized (todos) {
            return todos.stream()
                    .filter(todo -> Objects.equals(todo.getId(), id))
                    .findFirst();
        }
    }

    /**
     * Saves a todo (create or update).
     * @param todo The todo to save
     * @return The saved todo
     */
    public Todo save(Todo todo) {
        synchronized (todos) {
            if (todo.getId() == null) {
                // Create new todo
                todo.setId(idCounter.getAndIncrement());
                todos.add(todo);
            } else {
                // Update existing todo
                for (int i = 0; i < todos.size(); i++) {
                    if (Objects.equals(todos.get(i).getId(), todo.getId())) {
                        todos.set(i, todo);
                        break;
                    }
                }
            }
            return todo;
        }
    }

    /**
     * Deletes a todo by ID.
     * @param id The todo ID
     * @return true if the todo was deleted, false if not found
     */
    public boolean deleteById(Long id) {
        synchronized (todos) {
            return todos.removeIf(todo -> Objects.equals(todo.getId(), id));
        }
    }

    /**
     * Deletes all completed todos.
     * @return The number of todos deleted
     */
    public int deleteCompleted() {
        synchronized (todos) {
            int sizeBefore = todos.size();
            todos.removeIf(Todo::isCompleted);
            return sizeBefore - todos.size();
        }
    }

    /**
     * Gets the current number of todos.
     * @return The count of todos
     */
    public int count() {
        return todos.size();
    }

    /**
     * Clears all todos (useful for testing).
     */
    public void clear() {
        synchronized (todos) {
            todos.clear();
            idCounter.set(1);
        }
    }
}