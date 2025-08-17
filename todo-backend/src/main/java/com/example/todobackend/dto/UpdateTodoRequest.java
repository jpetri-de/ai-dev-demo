package com.example.todobackend.dto;

import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating an existing todo.
 * 
 * Enhanced for Feature 04-08 combined specification:
 * - Title is now optional to support partial updates
 * - When title is provided, it must not exceed 500 characters
 * - Service layer handles empty title validation and deletion logic
 */
public record UpdateTodoRequest(
    @Size(max = 500, message = "Title cannot exceed 500 characters")
    String title,
    Boolean completed
) {}