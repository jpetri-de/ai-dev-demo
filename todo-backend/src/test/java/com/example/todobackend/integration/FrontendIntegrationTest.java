package com.example.todobackend.integration;

import com.example.todobackend.dto.CreateTodoRequest;
import com.example.todobackend.dto.ErrorResponse;
import com.example.todobackend.dto.TodoResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for frontend-specific optimizations added in Feature 03.
 * Tests CORS configuration, debugging headers, and error response formats.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
public class FrontendIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void shouldReturnDebuggingHeadersOnCreateTodo() {
        // Given
        CreateTodoRequest request = new CreateTodoRequest("Test todo");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<CreateTodoRequest> entity = new HttpEntity<>(request, headers);

        // When
        ResponseEntity<TodoResponse> response = restTemplate.postForEntity("/api/todos", entity, TodoResponse.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getFirst("X-Created-ID")).isNotNull();
        assertThat(response.getHeaders().getFirst("X-Correlation-ID")).isNotNull();
        assertThat(response.getHeaders().getFirst("X-Request-ID")).isNotNull();
        assertThat(response.getHeaders().getFirst("Location")).contains("/api/todos/");
    }

    @Test
    void shouldReturnDebuggingHeadersOnGetAllTodos() {
        // When
        ResponseEntity<TodoResponse[]> response = restTemplate.getForEntity("/api/todos", TodoResponse[].class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst("X-Total-Count")).isNotNull();
        assertThat(response.getHeaders().getFirst("X-Request-ID")).isNotNull();
    }

    @Test
    void shouldReturnCorrelationIdInErrorResponse() {
        // Given - Invalid todo request (empty title)
        CreateTodoRequest request = new CreateTodoRequest("   ");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<CreateTodoRequest> entity = new HttpEntity<>(request, headers);

        // When
        ResponseEntity<ErrorResponse> response = restTemplate.postForEntity("/api/todos", entity, ErrorResponse.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getHeaders().getFirst("X-Correlation-ID")).isNotNull();
        assertThat(response.getHeaders().getFirst("X-Error-Type")).isEqualTo("VALIDATION_ERROR");
        
        ErrorResponse errorResponse = response.getBody();
        assertThat(errorResponse).isNotNull();
        assertThat(errorResponse.correlationId()).isNotNull();
        assertThat(errorResponse.path()).isEqualTo("/api/todos");
        assertThat(errorResponse.message()).contains("Validation failed");
    }

    @Test
    void shouldReturnValidationErrorsInStructuredFormat() {
        // Given - Invalid todo request (empty JSON body will trigger validation)
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String invalidJson = "{}"; // Missing required title field
        HttpEntity<String> entity = new HttpEntity<>(invalidJson, headers);

        // When
        ResponseEntity<ErrorResponse> response = restTemplate.postForEntity("/api/todos", entity, ErrorResponse.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getHeaders().getFirst("X-Error-Type")).isEqualTo("VALIDATION_ERROR");
        assertThat(response.getHeaders().getFirst("X-Validation-Error-Count")).isNotNull();
        
        ErrorResponse errorResponse = response.getBody();
        assertThat(errorResponse).isNotNull();
        assertThat(errorResponse.validationErrors()).isNotNull();
    }

    @Test
    void shouldReturnNotFoundErrorWithCorrelationId() {
        // When - Request non-existent todo
        ResponseEntity<ErrorResponse> response = restTemplate.getForEntity("/api/todos/99999", ErrorResponse.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getHeaders().getFirst("X-Correlation-ID")).isNotNull();
        assertThat(response.getHeaders().getFirst("X-Error-Type")).isEqualTo("ENTITY_NOT_FOUND");
        
        ErrorResponse errorResponse = response.getBody();
        assertThat(errorResponse).isNotNull();
        assertThat(errorResponse.correlationId()).isNotNull();
        assertThat(errorResponse.message()).contains("Todo not found with id: 99999");
    }

    @Test
    void shouldReturnDeletedCountHeader() {
        // Given - Create some completed todos first
        CreateTodoRequest request1 = new CreateTodoRequest("Todo 1");
        CreateTodoRequest request2 = new CreateTodoRequest("Todo 2");
        
        // Create todos
        ResponseEntity<TodoResponse> todo1Response = restTemplate.postForEntity("/api/todos", request1, TodoResponse.class);
        ResponseEntity<TodoResponse> todo2Response = restTemplate.postForEntity("/api/todos", request2, TodoResponse.class);
        
        // Toggle them to completed
        restTemplate.put("/api/todos/" + todo1Response.getBody().id() + "/toggle", null);
        restTemplate.put("/api/todos/" + todo2Response.getBody().id() + "/toggle", null);

        // When - Delete completed todos
        ResponseEntity<Void> response = restTemplate.exchange("/api/todos/completed", HttpMethod.DELETE, null, Void.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(response.getHeaders().getFirst("X-Deleted-Count")).isNotNull();
        assertThat(response.getHeaders().getFirst("X-Request-ID")).isNotNull();
    }

    @Test
    void shouldReturnToggleDebugInfo() {
        // Given - Create a todo first
        CreateTodoRequest request = new CreateTodoRequest("Test toggle");
        ResponseEntity<TodoResponse> createResponse = restTemplate.postForEntity("/api/todos", request, TodoResponse.class);
        Long todoId = createResponse.getBody().id();

        // When - Toggle the todo
        ResponseEntity<TodoResponse> response = restTemplate.exchange(
                "/api/todos/" + todoId + "/toggle", 
                HttpMethod.PUT, 
                null, 
                TodoResponse.class
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst("X-Toggled-ID")).isEqualTo(todoId.toString());
        assertThat(response.getHeaders().getFirst("X-Debug-Info")).contains("status=");
        assertThat(response.getHeaders().getFirst("X-Request-ID")).isNotNull();
    }

    @Test
    void shouldReturnCountTypeHeaders() {
        // When - Get active count
        ResponseEntity<Long> activeResponse = restTemplate.getForEntity("/api/todos/count/active", Long.class);
        
        // Then
        assertThat(activeResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(activeResponse.getHeaders().getFirst("X-Count-Type")).isEqualTo("active");
        assertThat(activeResponse.getHeaders().getFirst("X-Request-ID")).isNotNull();

        // When - Get total count
        ResponseEntity<Integer> totalResponse = restTemplate.getForEntity("/api/todos/count/total", Integer.class);
        
        // Then
        assertThat(totalResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(totalResponse.getHeaders().getFirst("X-Count-Type")).isEqualTo("total");
        assertThat(totalResponse.getHeaders().getFirst("X-Request-ID")).isNotNull();
    }
}