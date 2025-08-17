package com.example.todobackend.security;

import org.springframework.stereotype.Component;

/**
 * Utility class for security-related operations.
 * Feature 14: Enhanced Security - Input Sanitization and XSS Protection
 */
@Component
public class SecurityUtils {

    /**
     * Sanitizes input string to prevent XSS attacks.
     * - Trims whitespace
     * - Removes potentially dangerous HTML tags and characters
     * - Enforces maximum length limits
     * 
     * @param input The input string to sanitize
     * @return The sanitized string, or empty string if input was null
     */
    public String sanitizeInput(String input) {
        if (input == null) {
            return "";
        }
        
        String processed = input.trim()
                // Remove HTML tags (including script tags)
                .replaceAll("<[^>]*>", "")
                // Remove script injection attempts - match until )
                .replaceAll("(?i)javascript\\s*:[^)]*\\)", "") // javascript:alert('xss') 
                .replaceAll("(?i)vbscript\\s*:[^)]*\\)", "")   // vbscript:msgbox('xss')
                .replaceAll("(?i)on\\w+", "")  // onload, onclick, onerror -> remove completely
                .replaceAll("(?i)\\b(alert|eval|expression)\\s*\\([^)]*\\)", "") // function calls with parameters
                // Remove other potentially dangerous characters
                .replaceAll("[<>\"'&]", "");
                
        // Enforce length limit using the processed string length
        return processed.substring(0, Math.min(processed.length(), 500));
    }

    /**
     * Validates that a todo title is safe and meets requirements.
     * 
     * @param title The title to validate
     * @return true if the title is valid, false otherwise
     */
    public boolean isValidTodoTitle(String title) {
        if (title == null) {
            return false;
        }
        
        String sanitized = sanitizeInput(title);
        // Check if original length exceeds limit before sanitization
        if (title.length() > 500) {
            return false;
        }
        return !sanitized.trim().isEmpty();
    }

    /**
     * Sanitizes and validates a todo title in one operation.
     * 
     * @param title The title to sanitize and validate
     * @return The sanitized title
     * @throws IllegalArgumentException if the title is invalid after sanitization
     */
    public String sanitizeAndValidateTodoTitle(String title) {
        // Check length before sanitization
        if (title != null && title.length() > 500) {
            throw new IllegalArgumentException("Title cannot exceed 500 characters");
        }
        
        String sanitized = sanitizeInput(title);
        
        if (sanitized.trim().isEmpty()) {
            throw new IllegalArgumentException("Title cannot be empty");
        }
        
        return sanitized;
    }

    /**
     * Checks if the input appears to contain potential security threats.
     * 
     * @param input The input to check
     * @return true if the input appears suspicious, false otherwise
     */
    public boolean containsSecurityThreats(String input) {
        if (input == null) {
            return false;
        }
        
        String lowerInput = input.toLowerCase();
        return lowerInput.contains("<script") ||
               lowerInput.contains("javascript:") ||
               lowerInput.contains("vbscript:") ||
               lowerInput.contains("onload=") ||
               lowerInput.contains("onerror=") ||
               lowerInput.contains("onclick=") ||
               lowerInput.contains("eval(") ||
               lowerInput.contains("expression(") ||
               lowerInput.contains("alert(") ||
               lowerInput.contains("';") ||  // SQL injection attempt
               lowerInput.contains("\";");   // JavaScript string breaking
    }

    /**
     * Escapes HTML entities in the input string.
     * 
     * @param input The input string to escape
     * @return The escaped string
     */
    public String escapeHtml(String input) {
        if (input == null) {
            return "";
        }
        
        return input.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#x27;")
                   .replace("/", "&#x2F;");
    }
}