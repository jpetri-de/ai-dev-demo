package com.example.todobackend.exception;

import com.example.todobackend.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * Global exception handler for REST controllers.
 * Handles various exceptions and converts them to appropriate HTTP responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles TodoNotFoundException.
     * @param ex The exception
     * @return 404 NOT FOUND response
     */
    @ExceptionHandler(TodoNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleTodoNotFound(TodoNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
                ex.getMessage(),
                "The requested todo does not exist",
                HttpStatus.NOT_FOUND.value(),
                LocalDateTime.now().toString()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Handles Bean Validation errors.
     * @param ex The validation exception
     * @return 400 BAD REQUEST response
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        ErrorResponse error = new ErrorResponse(
                "Validation failed",
                details,
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now().toString()
        );
        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Handles IllegalArgumentException (e.g., empty title).
     * @param ex The exception
     * @return 400 BAD REQUEST response
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        ErrorResponse error = new ErrorResponse(
                ex.getMessage(),
                "Invalid request parameters",
                HttpStatus.BAD_REQUEST.value(),
                LocalDateTime.now().toString()
        );
        return ResponseEntity.badRequest().body(error);
    }

    /**
     * Handles generic exceptions.
     * @param ex The exception
     * @return 500 INTERNAL SERVER ERROR response
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse error = new ErrorResponse(
                "Internal server error",
                ex.getMessage(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                LocalDateTime.now().toString()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}