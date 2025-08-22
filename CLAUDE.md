# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Guidelines

**Important**: Before implementing anything, follow these principles from `resources/arbeitsweise.md`:
- Don't invent requirements - work with what's specified
- Always start with the simplest solution (think Minimum Viable Product)
- When in doubt, ask the user for clarification
- Present a plan before implementation and clarify any ambiguities
- Create test cases for every implementation covering happy flow, edge cases, and error scenarios

## Project Overview

This is a TodoMVC application implementation with the following multi-framework architecture:
- **Frontend**: Angular OR Vue.js application (framework-agnostic specs)
- **Backend**: Spring Boot application with REST API
- **Bundling**: Frontend and backend bundled as single deployable application

The project specifications are completely framework-neutral and support both Angular and Vue.js implementations.

## Multi-Framework Support

### Available Commands
- **`/fullstack-angular`** - Complete Angular + Spring Boot implementation
- **`/fullstack-vue`** - Complete Vue.js + Spring Boot implementation

### Framework-Neutral Specs
All specs in `specs/` directory are technology-neutral with framework adaptation guide available at `specs/00-framework-adaption-guide.md`.

### Agents Available
- **Angular**: angular-planner, angular-developer, angular-tester  
- **Vue.js**: vue-planner, vue-developer, vue-tester
- **Backend**: springboot-planner-agent, springboot-developer-agent, springboot-tester

## Application Requirements

### Todo Interface
```typescript
interface Todo {
  title: string;
  completed: boolean;
}
```

### Key Features to Implement
- Create, read, update, delete todos
- Mark individual todos as complete/incomplete
- Mark all todos as complete/incomplete
- Clear completed todos
- Filter todos (all/active/completed)
- Persistent counter of active todos
- Editing todos with double-click
- In-memory persistence only (no database)

### UI/UX Requirements
- Hide #main and #footer when no todos exist
- Focus input field on page load (autofocus attribute)
- Trim input and validate before creating todos
- Toggle all checkbox synchronizes with individual todo states
- Show destroy button on hover
- Enter/blur saves edits, Escape cancels edits
- Pluralized counter: "0 items", "1 item", "2 items"

## Architecture

### Frontend (Framework-Agnostic)
- **Angular**: Components (TodoAppComponent, TodoListComponent, etc.) with Services for HTTP
- **Vue.js**: Single File Components with Composables and Pinia stores
- **Styling**: Integration of existing CSS from `resources/css/main.css`
- **Development**: Port 4200 with proxy configuration for API calls
- **Build**: Framework-specific build systems (Angular CLI, Vite, etc.)

### Backend (Spring Boot 3.2)
- **Java Version**: 17
- **Build Tool**: Maven
- **CORS**: Configured for development (localhost:4200)
- **Storage**: In-memory List<Todo> without database
- **Production Port**: 8080

### REST API Endpoints
```
GET    /api/todos              - Retrieve all todos
POST   /api/todos              - Create new todo
PUT    /api/todos/{id}         - Update todo
DELETE /api/todos/{id}         - Delete todo
PUT    /api/todos/{id}/toggle  - Toggle todo status
DELETE /api/todos/completed    - Delete all completed todos
```

## Development Commands

**Note**: The project is currently in planning phase. No actual build system exists yet.

### When implementing the project structure:
```bash
# Backend setup (Maven-based Spring Boot)
mvn archetype:generate -DgroupId=com.example -DartifactId=todo-backend -DarchetypeArtifactId=maven-archetype-quickstart
cd todo-backend
mvn clean install
mvn spring-boot:run

# Frontend setup (Angular CLI)
ng new todo-frontend --routing --style=css
cd todo-frontend
ng serve --proxy-config proxy.conf.json

# Testing commands (when tests are implemented)
mvn test                    # Run backend tests
ng test                     # Run frontend unit tests
ng e2e                      # Run end-to-end tests

# Production build
ng build --configuration production
# Copy Angular dist/ to Spring Boot src/main/resources/static/
mvn package                 # Create executable JAR
```

### Development Workflow
- **Backend**: Spring Boot runs on port 8080
- **Frontend**: Angular dev server on port 4200 
- **Proxy**: Angular proxy configuration routes /api/* to Spring Boot
- **Hot Reload**: Enabled for frontend development
- **Single JAR**: Final deployment as executable JAR file

## Implementation Details

### UI/UX Specifications (from Screenshot Analysis)
- **Filter States**: All/Active/Completed with visual highlighting
- **Visual States**: Completed todos are crossed out, destroy button shows on hover
- **Toggle-All Checkbox**: Syncs with individual todo states, hidden when no todos
- **Counter**: `<strong>{count}</strong> item{s} left!` format, counts only active todos
- **Edit Mode**: Double-click activates, Enter/blur saves, Escape cancels
- **Input Behavior**: Auto-focus on load, trimmed input, no empty todos

### Technical Requirements
- **Browser Support**: Modern browsers (ES2020+)
- **Mobile Responsive**: Works on smartphone/tablet
- **Performance**: Smooth UI even with 1000+ todos
- **Security**: CORS, input sanitization, XSS prevention
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### Error Handling
- **Loading States**: Spinners during API calls
- **Retry Mechanism**: Automatic retry on network errors
- **Offline Handling**: Graceful degradation when API unreachable
- **Input Validation**: HTML escaping, max length (500 chars), whitespace trimming
- **Optimistic Updates**: Immediate UI updates, rollback on errors

## Implementation Specifications

The `specs/` directory contains 15 detailed feature specifications (in German) that define step-by-step implementation requirements:

- **01-backend-setup.md**: Spring Boot 3.2 setup with Maven and Java 17
- **02-todo-model.md**: Todo entity and data model
- **03-frontend-setup.md**: Angular 17 setup with proxy configuration
- **04-create-todo.md**: Create todo functionality
- **05-display-todos.md**: Display todo list
- **06-toggle-todo.md**: Toggle todo completion status
- **07-delete-todo.md**: Delete individual todos
- **08-edit-todo.md**: Edit todo titles
- **09-counter.md**: Active todo counter
- **10-filter-todos.md**: Filter by all/active/completed
- **11-toggle-all.md**: Toggle all todos at once
- **12-clear-completed.md**: Clear completed todos
- **13-ui-states.md**: UI state management
- **14-integration.md**: Frontend-backend integration
- **15-deployment.md**: Single JAR deployment

Each spec includes acceptance criteria, technical requirements, and test scenarios.

## Reference Materials

- **Primary specification**: `resources/project.md` (German, comprehensive technical requirements)
- **Development principles**: `resources/arbeitsweise.md` (German, mandatory workflow guidelines)
- **UI mockups**: `resources/screenshots/` (9 screenshots showing different app states)  
- **Base styling**: `resources/css/main.css` (TodoMVC styling foundation)
- **TodoMVC reference**: <https://todomvc.com>

## Current Project State

- **Phase**: Planning/Design - no code implementation exists yet
- **Available resources**: Documentation, UI mockups, base CSS
- **Next steps**: Implement project structure following specifications in `resources/project.md`
- **Key constraint**: Follow MVP approach and don't invent requirements beyond what's documented