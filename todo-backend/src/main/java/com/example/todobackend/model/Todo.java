package com.example.todobackend.model;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Todo entity representing a single todo item.
 * Contains id, title, completion status, and timestamps.
 */
public class Todo {
    private Long id;
    private String title;
    private boolean completed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Default constructor initializing completed to false and timestamps to now.
     */
    public Todo() {
        this.completed = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Constructor with title initialization.
     * @param title The title of the todo (will be trimmed)
     */
    public Todo(String title) {
        this();
        this.title = title != null ? title.trim() : null;
    }

    /**
     * Constructor with all fields.
     * @param id The todo ID
     * @param title The todo title
     * @param completed The completion status
     */
    public Todo(Long id, String title, boolean completed) {
        this(title);
        this.id = id;
        this.completed = completed;
    }

    /**
     * Updates the title and refreshes the updatedAt timestamp.
     * @param title The new title (will be trimmed)
     */
    public void updateTitle(String title) {
        this.title = title != null ? title.trim() : null;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Toggles the completion status and refreshes the updatedAt timestamp.
     */
    public void toggleCompleted() {
        this.completed = !this.completed;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Sets the completion status and refreshes the updatedAt timestamp.
     * @param completed The new completion status
     */
    public void setCompleted(boolean completed) {
        this.completed = completed;
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isCompleted() {
        return completed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Todo todo = (Todo) obj;
        return Objects.equals(id, todo.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Todo{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", completed=" + completed +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}