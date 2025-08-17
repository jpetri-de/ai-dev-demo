package com.example.todobackend.service;

import com.example.todobackend.model.Todo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;

class TodoStorageServiceTest {

    private TodoStorageService storageService;

    @BeforeEach
    void setUp() {
        storageService = new TodoStorageService();
    }

    @Test
    void findAll_EmptyStorage_ReturnsEmptyList() {
        // When
        List<Todo> result = storageService.findAll();

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void save_NewTodo_AssignsIdAndReturnsTodo() {
        // Given
        Todo todo = new Todo("Test Todo");

        // When
        Todo savedTodo = storageService.save(todo);

        // Then
        assertThat(savedTodo.getId()).isNotNull();
        assertThat(savedTodo.getId()).isEqualTo(1L);
        assertThat(savedTodo.getTitle()).isEqualTo("Test Todo");
        assertThat(savedTodo.isCompleted()).isFalse();
    }

    @Test
    void save_MultipleTodos_AssignsIncrementalIds() {
        // Given
        Todo todo1 = new Todo("Todo 1");
        Todo todo2 = new Todo("Todo 2");

        // When
        Todo saved1 = storageService.save(todo1);
        Todo saved2 = storageService.save(todo2);

        // Then
        assertThat(saved1.getId()).isEqualTo(1L);
        assertThat(saved2.getId()).isEqualTo(2L);
    }

    @Test
    void save_ExistingTodo_UpdatesTodo() {
        // Given
        Todo todo = storageService.save(new Todo("Original Title"));
        todo.updateTitle("Updated Title");
        todo.setCompleted(true);

        // When
        Todo updatedTodo = storageService.save(todo);

        // Then
        assertThat(updatedTodo.getId()).isEqualTo(todo.getId());
        assertThat(updatedTodo.getTitle()).isEqualTo("Updated Title");
        assertThat(updatedTodo.isCompleted()).isTrue();
    }

    @Test
    void findById_ExistingTodo_ReturnsTodo() {
        // Given
        Todo savedTodo = storageService.save(new Todo("Test Todo"));

        // When
        Optional<Todo> result = storageService.findById(savedTodo.getId());

        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(savedTodo.getId());
        assertThat(result.get().getTitle()).isEqualTo("Test Todo");
    }

    @Test
    void findById_NonExistingTodo_ReturnsEmpty() {
        // When
        Optional<Todo> result = storageService.findById(999L);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    void deleteById_ExistingTodo_DeletesAndReturnsTrue() {
        // Given
        Todo savedTodo = storageService.save(new Todo("Test Todo"));

        // When
        boolean result = storageService.deleteById(savedTodo.getId());

        // Then
        assertThat(result).isTrue();
        assertThat(storageService.findById(savedTodo.getId())).isEmpty();
        assertThat(storageService.findAll()).isEmpty();
    }

    @Test
    void deleteById_NonExistingTodo_ReturnsFalse() {
        // When
        boolean result = storageService.deleteById(999L);

        // Then
        assertThat(result).isFalse();
    }

    @Test
    void deleteCompleted_WithCompletedTodos_DeletesOnlyCompleted() {
        // Given
        Todo activeTodo = storageService.save(new Todo("Active Todo"));
        Todo completedTodo1 = storageService.save(new Todo("Completed Todo 1"));
        Todo completedTodo2 = storageService.save(new Todo("Completed Todo 2"));
        
        completedTodo1.setCompleted(true);
        completedTodo2.setCompleted(true);
        storageService.save(completedTodo1);
        storageService.save(completedTodo2);

        // When
        int deletedCount = storageService.deleteCompleted();

        // Then
        assertThat(deletedCount).isEqualTo(2);
        assertThat(storageService.findAll()).hasSize(1);
        assertThat(storageService.findById(activeTodo.getId())).isPresent();
        assertThat(storageService.findById(completedTodo1.getId())).isEmpty();
        assertThat(storageService.findById(completedTodo2.getId())).isEmpty();
    }

    @Test
    void deleteCompleted_NoCompletedTodos_ReturnsZero() {
        // Given
        storageService.save(new Todo("Active Todo 1"));
        storageService.save(new Todo("Active Todo 2"));

        // When
        int deletedCount = storageService.deleteCompleted();

        // Then
        assertThat(deletedCount).isEqualTo(0);
        assertThat(storageService.findAll()).hasSize(2);
    }

    @Test
    void count_ReturnsCorrectCount() {
        // Given
        storageService.save(new Todo("Todo 1"));
        storageService.save(new Todo("Todo 2"));
        storageService.save(new Todo("Todo 3"));

        // When
        int count = storageService.count();

        // Then
        assertThat(count).isEqualTo(3);
    }

    @Test
    void clear_RemovesAllTodosAndResetsCounter() {
        // Given
        storageService.save(new Todo("Todo 1"));
        storageService.save(new Todo("Todo 2"));

        // When
        storageService.clear();

        // Then
        assertThat(storageService.findAll()).isEmpty();
        assertThat(storageService.count()).isEqualTo(0);
        
        // Verify ID counter is reset
        Todo newTodo = storageService.save(new Todo("New Todo"));
        assertThat(newTodo.getId()).isEqualTo(1L);
    }

    @Test
    void threadSafety_ConcurrentOperations_MaintainsDataIntegrity() throws Exception {
        // Given
        ExecutorService executor = Executors.newFixedThreadPool(10);
        int numberOfOperations = 100;

        // When - Execute concurrent save operations
        CompletableFuture<Void>[] futures = new CompletableFuture[numberOfOperations];
        for (int i = 0; i < numberOfOperations; i++) {
            final int index = i;
            futures[i] = CompletableFuture.runAsync(() -> {
                storageService.save(new Todo("Todo " + index));
            }, executor);
        }

        // Wait for all operations to complete
        CompletableFuture.allOf(futures).get(5, TimeUnit.SECONDS);
        executor.shutdown();

        // Then
        List<Todo> todos = storageService.findAll();
        assertThat(todos).hasSize(numberOfOperations);
        
        // Verify all todos have unique IDs
        long uniqueIdCount = todos.stream().mapToLong(Todo::getId).distinct().count();
        assertThat(uniqueIdCount).isEqualTo(numberOfOperations);
    }

    @Test
    void findAll_ReturnsCopyForThreadSafety() {
        // Given
        storageService.save(new Todo("Test Todo"));
        
        // When
        List<Todo> todos1 = storageService.findAll();
        List<Todo> todos2 = storageService.findAll();

        // Then
        assertThat(todos1).isNotSameAs(todos2); // Different instances
        assertThat(todos1).isEqualTo(todos2); // But same content
        
        // Modifying returned list should not affect storage
        todos1.clear();
        assertThat(storageService.findAll()).hasSize(1);
    }
}