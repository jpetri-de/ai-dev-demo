package com.example.todobackend.dto;

/**
 * Response DTO for todo data.
 */
public record TodoResponse(
    Long id,
    String title,
    boolean completed
) {}