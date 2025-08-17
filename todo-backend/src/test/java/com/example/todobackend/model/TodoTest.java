package com.example.todobackend.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

class TodoTest {

    @Test
    void constructor_DefaultConstructor_InitializesCorrectly() {
        // When
        Todo todo = new Todo();

        // Then
        assertThat(todo.getId()).isNull();
        assertThat(todo.getTitle()).isNull();
        assertThat(todo.isCompleted()).isFalse();
        assertThat(todo.getCreatedAt()).isNotNull();
        assertThat(todo.getUpdatedAt()).isNotNull();
        // Check timestamps are close (within 1 second)
        assertThat(todo.getCreatedAt()).isCloseTo(todo.getUpdatedAt(), within(1, java.time.temporal.ChronoUnit.SECONDS));
    }

    @Test
    void constructor_WithTitle_InitializesCorrectly() {
        // When
        Todo todo = new Todo("Test Todo");

        // Then
        assertThat(todo.getId()).isNull();
        assertThat(todo.getTitle()).isEqualTo("Test Todo");
        assertThat(todo.isCompleted()).isFalse();
        assertThat(todo.getCreatedAt()).isNotNull();
        assertThat(todo.getUpdatedAt()).isNotNull();
    }

    @Test
    void constructor_WithTitleTrimming_TrimsWhitespace() {
        // When
        Todo todo = new Todo("  Test Todo  ");

        // Then
        assertThat(todo.getTitle()).isEqualTo("Test Todo");
    }

    @Test
    void constructor_WithNullTitle_HandlesNull() {
        // When
        Todo todo = new Todo(null);

        // Then
        assertThat(todo.getTitle()).isNull();
    }

    @Test
    void constructor_WithAllFields_InitializesCorrectly() {
        // When
        Todo todo = new Todo(1L, "Test Todo", true);

        // Then
        assertThat(todo.getId()).isEqualTo(1L);
        assertThat(todo.getTitle()).isEqualTo("Test Todo");
        assertThat(todo.isCompleted()).isTrue();
        assertThat(todo.getCreatedAt()).isNotNull();
        assertThat(todo.getUpdatedAt()).isNotNull();
    }

    @Test
    void updateTitle_ValidTitle_UpdatesTitleAndTimestamp() {
        // Given
        Todo todo = new Todo("Original Title");
        LocalDateTime originalUpdatedAt = todo.getUpdatedAt();

        // Ensure time difference for timestamp comparison
        try {
            Thread.sleep(2);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // When
        todo.updateTitle("Updated Title");

        // Then
        assertThat(todo.getTitle()).isEqualTo("Updated Title");
        assertThat(todo.getUpdatedAt()).isAfter(originalUpdatedAt);
    }

    @Test
    void updateTitle_WithWhitespace_TrimsTitle() {
        // Given
        Todo todo = new Todo("Original Title");

        // When
        todo.updateTitle("  Updated Title  ");

        // Then
        assertThat(todo.getTitle()).isEqualTo("Updated Title");
    }

    @Test
    void updateTitle_WithNull_SetsToNull() {
        // Given
        Todo todo = new Todo("Original Title");

        // When
        todo.updateTitle(null);

        // Then
        assertThat(todo.getTitle()).isNull();
    }

    @Test
    void toggleCompleted_FromFalse_SetsToTrue() {
        // Given
        Todo todo = new Todo("Test Todo");
        assertThat(todo.isCompleted()).isFalse();
        LocalDateTime originalUpdatedAt = todo.getUpdatedAt();

        // Ensure time difference for timestamp comparison
        try {
            Thread.sleep(2);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // When
        todo.toggleCompleted();

        // Then
        assertThat(todo.isCompleted()).isTrue();
        assertThat(todo.getUpdatedAt()).isAfter(originalUpdatedAt);
    }

    @Test
    void toggleCompleted_FromTrue_SetsToFalse() {
        // Given
        Todo todo = new Todo("Test Todo");
        todo.setCompleted(true);
        LocalDateTime originalUpdatedAt = todo.getUpdatedAt();

        // Ensure time difference for timestamp comparison
        try {
            Thread.sleep(2);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // When
        todo.toggleCompleted();

        // Then
        assertThat(todo.isCompleted()).isFalse();
        assertThat(todo.getUpdatedAt()).isAfter(originalUpdatedAt);
    }

    @Test
    void setCompleted_UpdatesStatusAndTimestamp() {
        // Given
        Todo todo = new Todo("Test Todo");
        LocalDateTime originalUpdatedAt = todo.getUpdatedAt();

        // Ensure time difference for timestamp comparison
        try {
            Thread.sleep(2);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // When
        todo.setCompleted(true);

        // Then
        assertThat(todo.isCompleted()).isTrue();
        assertThat(todo.getUpdatedAt()).isAfter(originalUpdatedAt);
    }

    @Test
    void equals_SameId_ReturnsTrue() {
        // Given
        Todo todo1 = new Todo(1L, "Todo 1", false);
        Todo todo2 = new Todo(1L, "Todo 2", true);

        // When & Then
        assertThat(todo1).isEqualTo(todo2);
        assertThat(todo1.hashCode()).isEqualTo(todo2.hashCode());
    }

    @Test
    void equals_DifferentId_ReturnsFalse() {
        // Given
        Todo todo1 = new Todo(1L, "Todo 1", false);
        Todo todo2 = new Todo(2L, "Todo 1", false);

        // When & Then
        assertThat(todo1).isNotEqualTo(todo2);
    }

    @Test
    void equals_BothNullId_ReturnsTrue() {
        // Given
        Todo todo1 = new Todo("Todo 1");
        Todo todo2 = new Todo("Todo 2");

        // When & Then
        assertThat(todo1).isEqualTo(todo2);
    }

    @Test
    void equals_OneNullId_ReturnsFalse() {
        // Given
        Todo todo1 = new Todo("Todo 1");
        Todo todo2 = new Todo(1L, "Todo 2", false);

        // When & Then
        assertThat(todo1).isNotEqualTo(todo2);
    }

    @Test
    void equals_SameInstance_ReturnsTrue() {
        // Given
        Todo todo = new Todo("Test Todo");

        // When & Then
        assertThat(todo).isEqualTo(todo);
    }

    @Test
    void equals_Null_ReturnsFalse() {
        // Given
        Todo todo = new Todo("Test Todo");

        // When & Then
        assertThat(todo).isNotEqualTo(null);
    }

    @Test
    void equals_DifferentClass_ReturnsFalse() {
        // Given
        Todo todo = new Todo("Test Todo");

        // When & Then
        assertThat(todo).isNotEqualTo("Not a Todo");
    }

    @Test
    void toString_ContainsAllFields() {
        // Given
        Todo todo = new Todo(1L, "Test Todo", true);

        // When
        String result = todo.toString();

        // Then
        assertThat(result).contains("id=1");
        assertThat(result).contains("title='Test Todo'");
        assertThat(result).contains("completed=true");
        assertThat(result).contains("createdAt=");
        assertThat(result).contains("updatedAt=");
    }
}