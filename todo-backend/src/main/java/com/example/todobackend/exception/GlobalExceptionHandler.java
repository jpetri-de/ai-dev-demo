package com.example.todobackend.exception;

import com.example.todobackend.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Global exception handler for REST controllers.
 * Handles various exceptions and converts them to appropriate HTTP responses.
 * Enhanced for Feature 03 with Angular-friendly error structures.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles TodoNotFoundException.
     * @param ex The exception
     * @param request The HTTP request
     * @return 404 NOT FOUND response
     */
    @ExceptionHandler(TodoNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleTodoNotFound(
            TodoNotFoundException ex, 
            HttpServletRequest request) {
        String correlationId = UUID.randomUUID().toString();
        
        ErrorResponse error = new ErrorResponse(
                ex.getMessage(),
                "The requested todo does not exist",
                HttpStatus.NOT_FOUND.value(),
                LocalDateTime.now().toString(),
                correlationId,
                request.getRequestURI(),
                null
        );
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .header("X-Correlation-ID", correlationId)
                .header("X-Error-Type", "ENTITY_NOT_FOUND")
                .body(error);
    }

    /**
     * Handles Bean Validation errors with detailed field-level error information.
     * @param ex The validation exception
     * @param request The HTTP request
     * @return 400 BAD REQUEST response
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        String correlationId = UUID.randomUUID().toString();
        
        // Create detailed validation errors for frontend form handling
        List<ErrorResponse.ValidationError> validationErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> new ErrorResponse.ValidationError(
                        error.getField(),
                        error.getRejectedValue(),
                        error.getDefaultMessage(),
                        error.getCode()
                ))
                .collect(Collectors.toList());

        String details = validationErrors.stream()
                .map(error -> error.field() + ": " + error.message())
                .collect(Collectors.joining(", "));

        ErrorResponse error = new ErrorResponse(
                "Validation failed",
                details,
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now().toString(),
                correlationId,
                request.getRequestURI(),
                validationErrors
        );
        
        return ResponseEntity.badRequest()
                .header("X-Correlation-ID", correlationId)
                .header("X-Error-Type", "VALIDATION_ERROR")
                .header("X-Validation-Error-Count", String.valueOf(validationErrors.size()))
                .body(error);
    }

    /**
     * Handles IllegalArgumentException (e.g., empty title).
     * @param ex The exception
     * @param request The HTTP request
     * @return 400 BAD REQUEST response
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request) {
        String correlationId = UUID.randomUUID().toString();
        
        ErrorResponse error = new ErrorResponse(
                ex.getMessage(),
                "Invalid request parameters",
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now().toString(),
                correlationId,
                request.getRequestURI(),
                null
        );
        
        return ResponseEntity.badRequest()
                .header("X-Correlation-ID", correlationId)
                .header("X-Error-Type", "INVALID_ARGUMENT")
                .body(error);
    }

    /**
     * Handles generic exceptions.
     * @param ex The exception
     * @param request The HTTP request
     * @return 500 INTERNAL SERVER ERROR response
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request) {
        String correlationId = UUID.randomUUID().toString();
        
        ErrorResponse error = new ErrorResponse(
                "Internal server error",
                ex.getMessage(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                LocalDateTime.now().toString(),
                correlationId,
                request.getRequestURI(),
                null
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .header("X-Correlation-ID", correlationId)
                .header("X-Error-Type", "INTERNAL_ERROR")
                .body(error);
    }
}