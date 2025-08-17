package com.example.todobackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a new todo.
 */
public record CreateTodoRequest(
    @NotBlank(message = "Title cannot be blank")
    @Size(max = 500, message = "Title cannot exceed 500 characters")
    String title
) {}