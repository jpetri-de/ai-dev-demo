package com.example.todobackend.service;

import com.example.todobackend.dto.CreateTodoRequest;
import com.example.todobackend.dto.TodoResponse;
import com.example.todobackend.dto.UpdateTodoRequest;
import com.example.todobackend.exception.TodoNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
class TodoServiceIntegrationTest {

    @Autowired
    private TodoService todoService;

    @Autowired
    private TodoStorageService storageService;

    @BeforeEach
    void setUp() {
        storageService.clear(); // Clear storage before each test
    }

    @Test
    void getAllTodos_EmptyStorage_ReturnsEmptyList() {
        // When
        List<TodoResponse> result = todoService.getAllTodos();

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void createTodo_ValidTitle_ReturnsTodoResponse() {
        // Given
        CreateTodoRequest request = new CreateTodoRequest("New Todo");

        // When
        TodoResponse result = todoService.createTodo(request);

        // Then
        assertThat(result.id()).isNotNull();
        assertThat(result.title()).isEqualTo("New Todo");
        assertThat(result.completed()).isFalse();
    }

    @Test
    void createTodo_EmptyTitle_ThrowsIllegalArgumentException() {
        // Given
        CreateTodoRequest request = new CreateTodoRequest("   ");

        // When & Then
        assertThatThrownBy(() -> todoService.createTodo(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Title cannot be empty");
    }

    @Test
    void updateTodo_ExistingTodo_ReturnsTodoResponse() {
        // Given
        TodoResponse created = todoService.createTodo(new CreateTodoRequest("Original Todo"));
        UpdateTodoRequest updateRequest = new UpdateTodoRequest("Updated Todo", true);

        // When
        TodoResponse result = todoService.updateTodo(created.id(), updateRequest);

        // Then
        assertThat(result.id()).isEqualTo(created.id());
        assertThat(result.title()).isEqualTo("Updated Todo");
        assertThat(result.completed()).isTrue();
    }

    @Test
    void updateTodo_NonExistingTodo_ThrowsTodoNotFoundException() {
        // Given
        UpdateTodoRequest updateRequest = new UpdateTodoRequest("Updated Todo", true);

        // When & Then
        assertThatThrownBy(() -> todoService.updateTodo(999L, updateRequest))
                .isInstanceOf(TodoNotFoundException.class)
                .hasMessage("Todo not found with id: 999");
    }

    @Test
    void toggleTodo_ExistingTodo_TogglesCompletion() {
        // Given
        TodoResponse created = todoService.createTodo(new CreateTodoRequest("Test Todo"));
        assertThat(created.completed()).isFalse();

        // When - Toggle once
        TodoResponse toggled1 = todoService.toggleTodo(created.id());

        // Then
        assertThat(toggled1.completed()).isTrue();

        // When - Toggle again
        TodoResponse toggled2 = todoService.toggleTodo(created.id());

        // Then
        assertThat(toggled2.completed()).isFalse();
    }

    @Test
    void toggleTodo_NonExistingTodo_ThrowsTodoNotFoundException() {
        // When & Then
        assertThatThrownBy(() -> todoService.toggleTodo(999L))
                .isInstanceOf(TodoNotFoundException.class)
                .hasMessage("Todo not found with id: 999");
    }

    @Test
    void deleteTodo_ExistingTodo_DeletesSuccessfully() {
        // Given
        TodoResponse created = todoService.createTodo(new CreateTodoRequest("Test Todo"));

        // When
        todoService.deleteTodo(created.id());

        // Then
        assertThat(todoService.getAllTodos()).isEmpty();
    }

    @Test
    void deleteTodo_NonExistingTodo_ThrowsTodoNotFoundException() {
        // When & Then
        assertThatThrownBy(() -> todoService.deleteTodo(999L))
                .isInstanceOf(TodoNotFoundException.class)
                .hasMessage("Todo not found with id: 999");
    }

    @Test
    void deleteCompletedTodos_WithCompletedTodos_DeletesOnlyCompleted() {
        // Given
        TodoResponse active = todoService.createTodo(new CreateTodoRequest("Active Todo"));
        TodoResponse completed1 = todoService.createTodo(new CreateTodoRequest("Completed Todo 1"));
        TodoResponse completed2 = todoService.createTodo(new CreateTodoRequest("Completed Todo 2"));

        // Mark todos as completed
        todoService.toggleTodo(completed1.id());
        todoService.toggleTodo(completed2.id());

        // When
        int deletedCount = todoService.deleteCompletedTodos();

        // Then
        assertThat(deletedCount).isEqualTo(2);
        List<TodoResponse> remaining = todoService.getAllTodos();
        assertThat(remaining).hasSize(1);
        assertThat(remaining.get(0).title()).isEqualTo("Active Todo");
    }

    @Test
    void getActiveTodoCount_ReturnsCorrectCount() {
        // Given
        todoService.createTodo(new CreateTodoRequest("Active Todo 1"));
        todoService.createTodo(new CreateTodoRequest("Active Todo 2"));
        TodoResponse completed = todoService.createTodo(new CreateTodoRequest("Completed Todo"));
        todoService.toggleTodo(completed.id());

        // When
        long result = todoService.getActiveTodoCount();

        // Then
        assertThat(result).isEqualTo(2);
    }

    @Test
    void getTotalTodoCount_ReturnsCorrectCount() {
        // Given
        todoService.createTodo(new CreateTodoRequest("Todo 1"));
        todoService.createTodo(new CreateTodoRequest("Todo 2"));
        todoService.createTodo(new CreateTodoRequest("Todo 3"));

        // When
        int result = todoService.getTotalTodoCount();

        // Then
        assertThat(result).isEqualTo(3);
    }

    @Test
    void fullWorkflow_CreateUpdateToggleDelete_WorksCorrectly() {
        // Create
        TodoResponse created = todoService.createTodo(new CreateTodoRequest("Test Todo"));
        assertThat(created.title()).isEqualTo("Test Todo");
        assertThat(created.completed()).isFalse();

        // Update
        UpdateTodoRequest updateRequest = new UpdateTodoRequest("Updated Todo", null);
        TodoResponse updated = todoService.updateTodo(created.id(), updateRequest);
        assertThat(updated.title()).isEqualTo("Updated Todo");
        assertThat(updated.completed()).isFalse();

        // Toggle
        TodoResponse toggled = todoService.toggleTodo(created.id());
        assertThat(toggled.completed()).isTrue();

        // Verify counts
        assertThat(todoService.getTotalTodoCount()).isEqualTo(1);
        assertThat(todoService.getActiveTodoCount()).isEqualTo(0);

        // Delete
        todoService.deleteTodo(created.id());
        assertThat(todoService.getAllTodos()).isEmpty();
        assertThat(todoService.getTotalTodoCount()).isEqualTo(0);
    }
}