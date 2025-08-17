package com.example.todobackend.mapper;

import com.example.todobackend.dto.CreateTodoRequest;
import com.example.todobackend.dto.TodoResponse;
import com.example.todobackend.dto.UpdateTodoRequest;
import com.example.todobackend.model.Todo;
import org.springframework.stereotype.Component;

/**
 * Manual implementation of TodoMapper as a temporary fix for MapStruct compilation issues.
 * This ensures the application can start and be tested while the MapStruct configuration is debugged.
 */
@Component
public class TodoMapperManualImpl implements TodoMapper {

    @Override
    public Todo toEntity(CreateTodoRequest request) {
        if (request == null) {
            return null;
        }
        
        Todo todo = new Todo();
        todo.setTitle(request.title());
        todo.setCompleted(false);
        return todo;
    }

    @Override
    public TodoResponse toResponse(Todo todo) {
        if (todo == null) {
            return null;
        }
        
        return new TodoResponse(
            todo.getId(),
            todo.getTitle(),
            todo.isCompleted()
        );
    }

    @Override
    public void updateEntity(UpdateTodoRequest request, Todo todo) {
        if (request == null || todo == null) {
            return;
        }
        
        todo.setTitle(request.title());
        if (request.completed() != null) {
            todo.setCompleted(request.completed());
        }
    }
}