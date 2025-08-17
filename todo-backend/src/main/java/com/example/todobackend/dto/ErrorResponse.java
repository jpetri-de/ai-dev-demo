package com.example.todobackend.dto;

import java.util.List;

/**
 * Response DTO for error information.
 * Enhanced for Feature 03 with Angular-friendly error structure.
 */
public record ErrorResponse(
    String message,
    String details,
    int status,
    String timestamp,
    String correlationId,
    String path,
    List<ValidationError> validationErrors
) {
    
    /**
     * Constructor for simple errors without validation details.
     */
    public ErrorResponse(String message, String details, int status, String timestamp) {
        this(message, details, status, timestamp, null, null, null);
    }
    
    /**
     * Constructor with correlation ID for debugging.
     */
    public ErrorResponse(String message, String details, int status, String timestamp, String correlationId) {
        this(message, details, status, timestamp, correlationId, null, null);
    }
    
    /**
     * Individual validation error for better frontend handling.
     */
    public record ValidationError(
        String field,
        Object rejectedValue,
        String message,
        String code
    ) {}
}