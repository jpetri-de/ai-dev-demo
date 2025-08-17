package com.example.todobackend.mapper;

import com.example.todobackend.dto.CreateTodoRequest;
import com.example.todobackend.dto.TodoResponse;
import com.example.todobackend.dto.UpdateTodoRequest;
import com.example.todobackend.model.Todo;
// Temporarily disabled to use manual implementation
// import org.mapstruct.Mapper;
// import org.mapstruct.Mapping;
// import org.mapstruct.MappingTarget;

/**
 * MapStruct mapper for converting between Todo entities and DTOs.
 * Temporarily using manual implementation due to MapStruct compilation issues.
 */
// @Mapper(componentModel = "spring")
public interface TodoMapper {

    /**
     * Maps CreateTodoRequest to Todo entity.
     * @param request The create request
     * @return New Todo entity
     */
    // @Mapping(target = "id", ignore = true)
    // @Mapping(target = "completed", constant = "false")
    // @Mapping(target = "createdAt", ignore = true)
    // @Mapping(target = "updatedAt", ignore = true)
    Todo toEntity(CreateTodoRequest request);

    /**
     * Maps Todo entity to TodoResponse.
     * @param todo The todo entity
     * @return TodoResponse DTO
     */
    TodoResponse toResponse(Todo todo);

    /**
     * Updates existing Todo entity with UpdateTodoRequest data.
     * @param request The update request
     * @param todo The existing todo entity to update
     */
    // @Mapping(target = "id", ignore = true)
    // @Mapping(target = "createdAt", ignore = true)
    // @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(UpdateTodoRequest request, Todo todo);
}