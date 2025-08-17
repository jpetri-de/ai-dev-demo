package com.example.todobackend.integration;

import com.example.todobackend.dto.CreateTodoRequest;
import com.example.todobackend.dto.TodoResponse;
import com.example.todobackend.dto.ToggleAllRequest;
import com.example.todobackend.service.TodoStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Toggle-All functionality (Feature 11).
 * Tests the PUT /api/todos/toggle-all endpoint with various scenarios.
 */
@SpringBootTest
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
class ToggleAllIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private TodoStorageService storageService;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        storageService.clear();
    }

    @Test
    void toggleAllTodos_WhenAllActive_ShouldCompleteAll() throws Exception {
        // Given: Create 3 active todos
        createTodo("Learn Spring Boot");
        createTodo("Learn Angular");
        createTodo("Build TodoMVC");

        ToggleAllRequest request = new ToggleAllRequest(true);

        // When: Toggle all to completed
        MvcResult result = mockMvc.perform(put("/api/todos/toggle-all")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Toggle-All-Status"))
                .andExpect(header().string("X-Toggle-All-Status", "true"))
                .andExpect(header().exists("X-Total-Count"))
                .andExpect(header().string("X-Total-Count", "3"))
                .andExpect(header().exists("X-Correlation-ID"))
                .andExpect(header().exists("X-Request-ID"))
                .andExpect(jsonPath("$.length()").value(3))
                .andReturn();

        // Then: All todos should be completed
        String responseBody = result.getResponse().getContentAsString();
        TodoResponse[] todos = objectMapper.readValue(responseBody, TodoResponse[].class);
        
        assertThat(todos).hasSize(3);
        assertThat(Arrays.stream(todos).allMatch(TodoResponse::completed))
                .as("All todos should be completed")
                .isTrue();
    }

    @Test
    void toggleAllTodos_WhenNoTodos_ShouldReturnEmptyList() throws Exception {
        // Given: No todos exist
        ToggleAllRequest request = new ToggleAllRequest(true);

        // When: Toggle all
        mockMvc.perform(put("/api/todos/toggle-all")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(header().string("X-Toggle-All-Status", "true"))
                .andExpect(header().string("X-Total-Count", "0"))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void toggleAllTodos_WithInvalidRequest_ShouldReturnBadRequest() throws Exception {
        // Given: Invalid request with null completed value
        String invalidJson = "{\"completed\": null}";

        // When & Then: Should return 400 Bad Request
        mockMvc.perform(put("/api/todos/toggle-all")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    // Helper methods

    private Long createTodo(String title) throws Exception {
        CreateTodoRequest createRequest = new CreateTodoRequest(title);
        
        MvcResult result = mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        TodoResponse todo = objectMapper.readValue(responseBody, TodoResponse.class);
        return todo.id();
    }
}