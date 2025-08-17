package com.example.todobackend.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for toggling all todos to the same completion status.
 * Feature 11: Toggle-All Functionality
 */
public record ToggleAllRequest(
    @NotNull(message = "Completed status must be specified")
    Boolean completed
) {}