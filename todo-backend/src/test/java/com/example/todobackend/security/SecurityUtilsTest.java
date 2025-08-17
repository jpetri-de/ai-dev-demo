package com.example.todobackend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for SecurityUtils class.
 * Tests security-related functionality for Feature 14: Enhanced Security.
 */
class SecurityUtilsTest {

    private SecurityUtils securityUtils;

    @BeforeEach
    void setUp() {
        securityUtils = new SecurityUtils();
    }

    @Test
    @DisplayName("Sanitize input should trim whitespace")
    void sanitizeInput_ShouldTrimWhitespace() {
        // Given
        String input = "  Hello World  ";

        // When
        String result = securityUtils.sanitizeInput(input);

        // Then
        assertThat(result).isEqualTo("Hello World");
    }

    @Test
    @DisplayName("Sanitize input should remove HTML tags")
    void sanitizeInput_ShouldRemoveHtmlTags() {
        // Given
        String input = "<script>alert('xss')</script>Hello<b>World</b>";

        // When
        String result = securityUtils.sanitizeInput(input);

        // Then
        assertThat(result).isEqualTo("HelloWorld");
    }

    @Test
    @DisplayName("Sanitize input should remove JavaScript injection attempts")
    void sanitizeInput_ShouldRemoveJavaScriptInjection() {
        // Given
        String input = "javascript:alert('xss')Hello World";

        // When
        String result = securityUtils.sanitizeInput(input);

        // Then
        assertThat(result).isEqualTo("Hello World");
    }

    @Test
    @DisplayName("Sanitize input should remove VBScript injection attempts")
    void sanitizeInput_ShouldRemoveVbScriptInjection() {
        // Given
        String input = "vbscript:msgbox('xss')Hello World";

        // When
        String result = securityUtils.sanitizeInput(input);

        // Then
        assertThat(result).isEqualTo("Hello World");
    }

    @Test
    @DisplayName("Sanitize input should remove event handlers")
    void sanitizeInput_ShouldRemoveEventHandlers() {
        // Given
        String input = "onload onclick onerror Hello World";

        // When
        String result = securityUtils.sanitizeInput(input);

        // Then
        assertThat(result).isEqualTo("   Hello World");
    }

    @Test
    @DisplayName("Sanitize input should remove dangerous characters")
    void sanitizeInput_ShouldRemoveDangerousCharacters() {
        // Given
        String input = "Hello<>\"'&World";

        // When
        String result = securityUtils.sanitizeInput(input);

        // Then
        assertThat(result).isEqualTo("HelloWorld");
    }

    @Test
    @DisplayName("Sanitize input should enforce length limit")
    void sanitizeInput_ShouldEnforceLengthLimit() {
        // Given
        String input = "a".repeat(600); // 600 characters

        // When
        String result = securityUtils.sanitizeInput(input);

        // Then
        assertThat(result).hasSize(500);
    }

    @Test
    @DisplayName("Sanitize input should handle null input")
    void sanitizeInput_ShouldHandleNullInput() {
        // Given
        String input = null;

        // When
        String result = securityUtils.sanitizeInput(input);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Valid todo title should return true for good input")
    void isValidTodoTitle_ShouldReturnTrueForValidInput() {
        // Given
        String validTitle = "Learn Spring Boot";

        // When
        boolean result = securityUtils.isValidTodoTitle(validTitle);

        // Then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Valid todo title should return false for null input")
    void isValidTodoTitle_ShouldReturnFalseForNullInput() {
        // Given
        String input = null;

        // When
        boolean result = securityUtils.isValidTodoTitle(input);

        // Then
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Valid todo title should return false for empty input after sanitization")
    void isValidTodoTitle_ShouldReturnFalseForEmptyInputAfterSanitization() {
        // Given
        String input = "<script></script>   ";

        // When
        boolean result = securityUtils.isValidTodoTitle(input);

        // Then
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Valid todo title should return false for input exceeding length limit")
    void isValidTodoTitle_ShouldReturnFalseForTooLongInput() {
        // Given
        String input = "a".repeat(501); // 501 characters

        // When
        boolean result = securityUtils.isValidTodoTitle(input);

        // Then
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Sanitize and validate should return clean title for valid input")
    void sanitizeAndValidateTodoTitle_ShouldReturnCleanTitleForValidInput() {
        // Given
        String input = "  Learn <b>Spring Boot</b>  ";

        // When
        String result = securityUtils.sanitizeAndValidateTodoTitle(input);

        // Then
        assertThat(result).isEqualTo("Learn Spring Boot");
    }

    @Test
    @DisplayName("Sanitize and validate should throw exception for empty input after sanitization")
    void sanitizeAndValidateTodoTitle_ShouldThrowExceptionForEmptyInput() {
        // Given
        String input = "<script></script>   ";

        // When & Then
        assertThatThrownBy(() -> securityUtils.sanitizeAndValidateTodoTitle(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Title cannot be empty");
    }

    @Test
    @DisplayName("Sanitize and validate should throw exception for too long input")
    void sanitizeAndValidateTodoTitle_ShouldThrowExceptionForTooLongInput() {
        // Given
        String input = "a".repeat(501); // 501 characters

        // When & Then
        assertThatThrownBy(() -> securityUtils.sanitizeAndValidateTodoTitle(input))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Title cannot exceed 500 characters");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "vbscript:msgbox('xss')",
            "onload=alert('xss')",
            "onerror=alert('xss')",
            "onclick=alert('xss')",
            "eval(alert('xss'))",
            "expression(alert('xss'))"
    })
    @DisplayName("Contains security threats should detect various XSS attempts")
    void containsSecurityThreats_ShouldDetectXssAttempts(String maliciousInput) {
        // When
        boolean result = securityUtils.containsSecurityThreats(maliciousInput);

        // Then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Contains security threats should return false for safe input")
    void containsSecurityThreats_ShouldReturnFalseForSafeInput() {
        // Given
        String safeInput = "Learn Spring Boot and Angular";

        // When
        boolean result = securityUtils.containsSecurityThreats(safeInput);

        // Then
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Contains security threats should handle null input")
    void containsSecurityThreats_ShouldHandleNullInput() {
        // Given
        String input = null;

        // When
        boolean result = securityUtils.containsSecurityThreats(input);

        // Then
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Escape HTML should properly escape HTML entities")
    void escapeHtml_ShouldEscapeHtmlEntities() {
        // Given
        String input = "<script>alert('xss')</script> & \"quoted\" text";

        // When
        String result = securityUtils.escapeHtml(input);

        // Then
        assertThat(result).isEqualTo("&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt; &amp; &quot;quoted&quot; text");
    }

    @Test
    @DisplayName("Escape HTML should handle null input")
    void escapeHtml_ShouldHandleNullInput() {
        // Given
        String input = null;

        // When
        String result = securityUtils.escapeHtml(input);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Escape HTML should handle empty input")
    void escapeHtml_ShouldHandleEmptyInput() {
        // Given
        String input = "";

        // When
        String result = securityUtils.escapeHtml(input);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Case insensitive security threat detection")
    void containsSecurityThreats_ShouldBeCaseInsensitive() {
        // Given
        String input = "JAVASCRIPT:ALERT('XSS')";

        // When
        boolean result = securityUtils.containsSecurityThreats(input);

        // Then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Real world XSS examples should be detected")
    void containsSecurityThreats_ShouldDetectRealWorldXss() {
        // Given
        String[] xssExamples = {
                "todo<img src=x onerror=alert('xss')>",
                "todo\"><script>alert('xss')</script>",
                "todo</script><script>alert('xss')</script>",
                "todo'><script>alert('xss')</script>",
                "todo\";alert('xss');//"
        };

        // When & Then
        for (String xss : xssExamples) {
            assertThat(securityUtils.containsSecurityThreats(xss))
                    .as("Should detect XSS in: " + xss)
                    .isTrue();
        }
    }
}