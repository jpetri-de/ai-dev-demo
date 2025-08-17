package com.example.todobackend.dto;

/**
 * Response DTO for error information.
 */
public record ErrorResponse(
    String message,
    String details,
    int status,
    String timestamp
) {}