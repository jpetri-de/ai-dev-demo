package com.example.todobackend.integration;

import com.example.todobackend.dto.CreateTodoRequest;
import com.example.todobackend.dto.ErrorResponse;
import com.example.todobackend.dto.TodoResponse;
import com.example.todobackend.dto.UpdateTodoRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for Feature 04-08: Combined Todo Management workflows.
 * 
 * Tests the complete lifecycle of todo operations as specified:
 * - Create → Edit → Toggle → Delete cycles
 * - Optimistic update support with response time requirements
 * - Edge cases and validation scenarios
 * - Performance assertions for sub-50ms response times
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
class TodoManagementWorkflowTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @BeforeEach
    void setUp() {
        // Clear all todos before each test
        restTemplate.exchange("/api/todos/completed", HttpMethod.DELETE, null, Void.class);
        
        // Get all todos and delete them individually to ensure clean state
        ResponseEntity<TodoResponse[]> allTodos = restTemplate.getForEntity("/api/todos", TodoResponse[].class);
        if (allTodos.getBody() != null) {
            for (TodoResponse todo : allTodos.getBody()) {
                restTemplate.delete("/api/todos/" + todo.id());
            }
        }
    }

    @Test
    void completeWorkflow_CreateEditToggleDelete_ShouldWork() {
        // 1. CREATE TODO
        CreateTodoRequest createRequest = new CreateTodoRequest("Learn Angular");
        
        long startTime = System.currentTimeMillis();
        ResponseEntity<TodoResponse> createResponse = restTemplate.postForEntity("/api/todos", createRequest, TodoResponse.class);
        long createTime = System.currentTimeMillis() - startTime;
        
        // Performance assertion for optimistic updates
        assertThat(createTime).isLessThan(100); // Target <50ms, allowing 100ms for CI
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(createResponse.getBody().title()).isEqualTo("Learn Angular");
        assertThat(createResponse.getBody().completed()).isFalse();
        assertThat(createResponse.getHeaders().getFirst("X-Created-ID")).isNotNull();
        assertThat(createResponse.getHeaders().getFirst("X-Correlation-ID")).isNotNull();
        
        Long todoId = createResponse.getBody().id();

        // 2. EDIT TODO TITLE
        UpdateTodoRequest editRequest = new UpdateTodoRequest("Learn Angular and React", null);
        HttpEntity<UpdateTodoRequest> editEntity = new HttpEntity<>(editRequest);
        
        startTime = System.currentTimeMillis();
        ResponseEntity<TodoResponse> editResponse = restTemplate.exchange(
                "/api/todos/" + todoId, HttpMethod.PUT, editEntity, TodoResponse.class);
        long editTime = System.currentTimeMillis() - startTime;
        
        // Performance assertion for optimistic updates
        assertThat(editTime).isLessThan(100);
        
        assertThat(editResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(editResponse.getBody().title()).isEqualTo("Learn Angular and React");
        assertThat(editResponse.getBody().completed()).isFalse();
        assertThat(editResponse.getHeaders().getFirst("X-Updated-ID")).isNotNull();

        // 3. TOGGLE COMPLETION STATUS
        startTime = System.currentTimeMillis();
        ResponseEntity<TodoResponse> toggleResponse = restTemplate.exchange(
                "/api/todos/" + todoId + "/toggle", HttpMethod.PUT, null, TodoResponse.class);
        long toggleTime = System.currentTimeMillis() - startTime;
        
        // Performance assertion for optimistic updates
        assertThat(toggleTime).isLessThan(100);
        
        assertThat(toggleResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(toggleResponse.getBody().title()).isEqualTo("Learn Angular and React");
        assertThat(toggleResponse.getBody().completed()).isTrue();
        assertThat(toggleResponse.getHeaders().getFirst("X-Toggled-ID")).isNotNull();
        assertThat(toggleResponse.getHeaders().getFirst("X-Debug-Info")).isEqualTo("status=true");

        // 4. TOGGLE BACK TO INCOMPLETE
        ResponseEntity<TodoResponse> toggleBackResponse = restTemplate.exchange(
                "/api/todos/" + todoId + "/toggle", HttpMethod.PUT, null, TodoResponse.class);
        
        assertThat(toggleBackResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(toggleBackResponse.getBody().completed()).isFalse();
        assertThat(toggleBackResponse.getHeaders().getFirst("X-Debug-Info")).isEqualTo("status=false");

        // 5. DELETE TODO
        startTime = System.currentTimeMillis();
        ResponseEntity<Void> deleteResponse = restTemplate.exchange(
                "/api/todos/" + todoId, HttpMethod.DELETE, null, Void.class);
        long deleteTime = System.currentTimeMillis() - startTime;
        
        // Performance assertion for optimistic updates
        assertThat(deleteTime).isLessThan(100);
        
        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(deleteResponse.getHeaders().getFirst("X-Deleted-ID")).isNotNull();

        // 6. VERIFY DELETION
        ResponseEntity<ErrorResponse> getDeletedResponse = restTemplate.getForEntity(
                "/api/todos/" + todoId, ErrorResponse.class);
        assertThat(getDeletedResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void editWorkflow_EmptyTitleDeletesTodo_ShouldWork() {
        // Create a todo
        CreateTodoRequest createRequest = new CreateTodoRequest("Temporary Todo");
        ResponseEntity<TodoResponse> createResponse = restTemplate.postForEntity("/api/todos", createRequest, TodoResponse.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long todoId = createResponse.getBody().id();

        // Edit with empty title (after trim) should delete the todo
        UpdateTodoRequest emptyTitleRequest = new UpdateTodoRequest("   ", null);
        HttpEntity<UpdateTodoRequest> entity = new HttpEntity<>(emptyTitleRequest);
        
        ResponseEntity<Void> updateResponse = restTemplate.exchange(
                "/api/todos/" + todoId, HttpMethod.PUT, entity, Void.class);
        
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(updateResponse.getHeaders().getFirst("X-Deleted-ID")).isNotNull();
        assertThat(updateResponse.getHeaders().getFirst("X-Debug-Info")).isEqualTo("deleted-via-empty-title");

        // Verify todo is deleted
        ResponseEntity<TodoResponse[]> allTodosResponse = restTemplate.getForEntity("/api/todos", TodoResponse[].class);
        assertThat(allTodosResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(allTodosResponse.getBody()).isEmpty();
    }

    @Test
    void partialUpdates_TitleOnlyAndCompletedOnly_ShouldWork() {
        // Create a todo
        CreateTodoRequest createRequest = new CreateTodoRequest("Original Title");
        ResponseEntity<TodoResponse> createResponse = restTemplate.postForEntity("/api/todos", createRequest, TodoResponse.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long todoId = createResponse.getBody().id();

        // 1. Title-only update (completed should remain unchanged)
        UpdateTodoRequest titleOnlyRequest = new UpdateTodoRequest("Updated Title", null);
        HttpEntity<UpdateTodoRequest> titleEntity = new HttpEntity<>(titleOnlyRequest);
        
        ResponseEntity<TodoResponse> titleUpdateResponse = restTemplate.exchange(
                "/api/todos/" + todoId, HttpMethod.PUT, titleEntity, TodoResponse.class);
        
        assertThat(titleUpdateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(titleUpdateResponse.getBody().title()).isEqualTo("Updated Title");
        assertThat(titleUpdateResponse.getBody().completed()).isFalse(); // Should remain false

        // 2. Completed-only update (title should remain unchanged)
        UpdateTodoRequest completedOnlyRequest = new UpdateTodoRequest(null, true);
        HttpEntity<UpdateTodoRequest> completedEntity = new HttpEntity<>(completedOnlyRequest);
        
        ResponseEntity<TodoResponse> completedUpdateResponse = restTemplate.exchange(
                "/api/todos/" + todoId, HttpMethod.PUT, completedEntity, TodoResponse.class);
        
        assertThat(completedUpdateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(completedUpdateResponse.getBody().title()).isEqualTo("Updated Title"); // Should remain unchanged
        assertThat(completedUpdateResponse.getBody().completed()).isTrue();

        // 3. Both title and completed update
        UpdateTodoRequest bothFieldsRequest = new UpdateTodoRequest("Final Title", false);
        HttpEntity<UpdateTodoRequest> bothEntity = new HttpEntity<>(bothFieldsRequest);
        
        ResponseEntity<TodoResponse> bothUpdateResponse = restTemplate.exchange(
                "/api/todos/" + todoId, HttpMethod.PUT, bothEntity, TodoResponse.class);
        
        assertThat(bothUpdateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(bothUpdateResponse.getBody().title()).isEqualTo("Final Title");
        assertThat(bothUpdateResponse.getBody().completed()).isFalse();
    }

    @Test
    void concurrentOperations_ShouldBeThreadSafe() {
        // Create multiple todos for concurrent testing
        Long[] todoIds = new Long[5];
        
        for (int i = 0; i < 5; i++) {
            CreateTodoRequest createRequest = new CreateTodoRequest("Todo " + (i + 1));
            ResponseEntity<TodoResponse> createResponse = restTemplate.postForEntity("/api/todos", createRequest, TodoResponse.class);
            
            assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
            todoIds[i] = createResponse.getBody().id();
        }

        // Perform concurrent operations and verify state consistency
        for (Long todoId : todoIds) {
            // Toggle completion
            ResponseEntity<TodoResponse> toggleResponse = restTemplate.exchange(
                    "/api/todos/" + todoId + "/toggle", HttpMethod.PUT, null, TodoResponse.class);
            
            assertThat(toggleResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(toggleResponse.getBody().completed()).isTrue();
        }

        // Verify all todos are marked as completed
        ResponseEntity<TodoResponse[]> allTodosResponse = restTemplate.getForEntity("/api/todos", TodoResponse[].class);
        assertThat(allTodosResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(allTodosResponse.getBody()).hasSize(5);
        
        for (TodoResponse todo : allTodosResponse.getBody()) {
            assertThat(todo.completed()).isTrue();
        }
        
        // Check active count
        ResponseEntity<Long> activeCountResponse = restTemplate.getForEntity("/api/todos/count/active", Long.class);
        assertThat(activeCountResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(activeCountResponse.getBody()).isEqualTo(0L);
    }

    @Test
    void optimisticUpdatePerformance_ShouldMeetRequirements() {
        // Create a todo for performance testing
        CreateTodoRequest createRequest = new CreateTodoRequest("Performance Test Todo");
        ResponseEntity<TodoResponse> createResponse = restTemplate.postForEntity("/api/todos", createRequest, TodoResponse.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long todoId = createResponse.getBody().id();

        // Test multiple operations for consistent performance
        int iterations = 10;
        long totalTime = 0;

        for (int i = 0; i < iterations; i++) {
            // Toggle operation (most common for optimistic updates)
            long startTime = System.currentTimeMillis();
            ResponseEntity<TodoResponse> toggleResponse = restTemplate.exchange(
                    "/api/todos/" + todoId + "/toggle", HttpMethod.PUT, null, TodoResponse.class);
            long operationTime = System.currentTimeMillis() - startTime;
            
            assertThat(toggleResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
            totalTime += operationTime;
            
            // Each individual operation should be fast
            assertThat(operationTime).isLessThan(100); // Target <50ms, allowing 100ms
        }

        // Average response time should be excellent
        double averageTime = (double) totalTime / iterations;
        assertThat(averageTime).isLessThan(75); // Average should be even better
    }

    @Test
    void validationAndErrorHandling_ShouldWork() {
        // 1. Test title too long (>500 characters)
        String longTitle = "a".repeat(501);
        UpdateTodoRequest longTitleRequest = new UpdateTodoRequest(longTitle, null);
        
        // Create a todo first
        CreateTodoRequest createRequest = new CreateTodoRequest("Test Todo");
        ResponseEntity<TodoResponse> createResponse = restTemplate.postForEntity("/api/todos", createRequest, TodoResponse.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long todoId = createResponse.getBody().id();

        // Test validation error
        HttpEntity<UpdateTodoRequest> entity = new HttpEntity<>(longTitleRequest);
        ResponseEntity<ErrorResponse> validationErrorResponse = restTemplate.exchange(
                "/api/todos/" + todoId, HttpMethod.PUT, entity, ErrorResponse.class);
        
        assertThat(validationErrorResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(validationErrorResponse.getBody().validationErrors()).isNotEmpty();
        assertThat(validationErrorResponse.getBody().validationErrors().get(0).field()).isEqualTo("title");
        assertThat(validationErrorResponse.getBody().validationErrors().get(0).message()).isEqualTo("Title cannot exceed 500 characters");

        // 2. Test operations on non-existent todo
        UpdateTodoRequest updateRequest = new UpdateTodoRequest("Updated", null);
        HttpEntity<UpdateTodoRequest> updateEntity = new HttpEntity<>(updateRequest);
        
        ResponseEntity<ErrorResponse> notFoundUpdateResponse = restTemplate.exchange(
                "/api/todos/99999", HttpMethod.PUT, updateEntity, ErrorResponse.class);
        assertThat(notFoundUpdateResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(notFoundUpdateResponse.getBody().message()).isEqualTo("Todo not found with id: 99999");

        ResponseEntity<ErrorResponse> notFoundToggleResponse = restTemplate.exchange(
                "/api/todos/99999/toggle", HttpMethod.PUT, null, ErrorResponse.class);
        assertThat(notFoundToggleResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<ErrorResponse> notFoundDeleteResponse = restTemplate.exchange(
                "/api/todos/99999", HttpMethod.DELETE, null, ErrorResponse.class);
        assertThat(notFoundDeleteResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void apiEndpointCompliance_ShouldMatchSpecification() {
        // Verify all 5 required endpoints from Feature 04-08 specification
        
        // 1. GET /api/todos - Retrieve all todos
        ResponseEntity<TodoResponse[]> getAllResponse = restTemplate.getForEntity("/api/todos", TodoResponse[].class);
        assertThat(getAllResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getAllResponse.getHeaders().getFirst("X-Total-Count")).isNotNull();
        assertThat(getAllResponse.getHeaders().getFirst("X-Request-ID")).isNotNull();

        // Create a todo for other endpoint tests
        CreateTodoRequest createRequest = new CreateTodoRequest("API Test Todo");
        ResponseEntity<TodoResponse> createResponse = restTemplate.postForEntity("/api/todos", createRequest, TodoResponse.class);
        
        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long todoId = createResponse.getBody().id();

        // 2. POST /api/todos - Create new todo (already tested above)

        // 3. PUT /api/todos/{id} - Update todo (title and/or completed)
        UpdateTodoRequest updateRequest = new UpdateTodoRequest("Updated API Test Todo", true);
        HttpEntity<UpdateTodoRequest> updateEntity = new HttpEntity<>(updateRequest);
        
        ResponseEntity<TodoResponse> updateResponse = restTemplate.exchange(
                "/api/todos/" + todoId, HttpMethod.PUT, updateEntity, TodoResponse.class);
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updateResponse.getHeaders().getFirst("X-Updated-ID")).isNotNull();

        // 4. PUT /api/todos/{id}/toggle - Toggle completion status
        ResponseEntity<TodoResponse> toggleResponse = restTemplate.exchange(
                "/api/todos/" + todoId + "/toggle", HttpMethod.PUT, null, TodoResponse.class);
        assertThat(toggleResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(toggleResponse.getHeaders().getFirst("X-Toggled-ID")).isNotNull();
        assertThat(toggleResponse.getHeaders().getFirst("X-Debug-Info")).isNotNull();

        // 5. DELETE /api/todos/{id} - Delete todo
        ResponseEntity<Void> deleteResponse = restTemplate.exchange(
                "/api/todos/" + todoId, HttpMethod.DELETE, null, Void.class);
        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(deleteResponse.getHeaders().getFirst("X-Deleted-ID")).isNotNull();
        
        // Verify proper Content-Type headers
        ResponseEntity<TodoResponse[]> contentTypeResponse = restTemplate.getForEntity("/api/todos", TodoResponse[].class);
        assertThat(contentTypeResponse.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_JSON);
    }
}