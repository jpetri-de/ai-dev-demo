package com.example.todobackend.mapper;

import com.example.todobackend.dto.CreateTodoRequest;
import com.example.todobackend.dto.TodoResponse;
import com.example.todobackend.dto.UpdateTodoRequest;
import com.example.todobackend.model.Todo;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-08-17T16:42:42+0200",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 24.0.2 (Homebrew)"
)
@Component
public class TodoMapperImpl implements TodoMapper {

    @Override
    public Todo toEntity(CreateTodoRequest request) {
        if ( request == null ) {
            return null;
        }

        Todo todo = new Todo();

        todo.setTitle( request.title() );

        todo.setCompleted( false );

        return todo;
    }

    @Override
    public TodoResponse toResponse(Todo todo) {
        if ( todo == null ) {
            return null;
        }

        Long id = null;
        String title = null;
        boolean completed = false;

        id = todo.getId();
        title = todo.getTitle();
        completed = todo.isCompleted();

        TodoResponse todoResponse = new TodoResponse( id, title, completed );

        return todoResponse;
    }

    @Override
    public void updateEntity(UpdateTodoRequest request, Todo todo) {
        if ( request == null ) {
            return;
        }

        if ( request.completed() != null ) {
            todo.setCompleted( request.completed() );
        }
        todo.setTitle( request.title() );
    }
}
