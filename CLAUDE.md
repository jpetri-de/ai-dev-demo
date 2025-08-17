# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TodoMVC application implementation with the following architecture:
- **Frontend**: Angular application
- **Backend**: Spring Boot application with REST API
- **Bundling**: Frontend and backend bundled as single deployable application

The project is currently in planning/design phase with only documentation and CSS resources available.

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

### Frontend (Angular)
- Main todo interface following TodoMVC specification
- REST client for backend communication
- Base CSS provided in `resources/css/main.css`

### Backend (Spring Boot)
- REST API for all CRUD operations
- Service layer for business logic
- In-memory data storage (no database persistence)

## Development Setup

**Note**: This project currently contains only documentation and design resources. No build system, package management, or development tools have been set up yet.

When implementing:
1. Set up Angular project structure with CLI
2. Set up Spring Boot project with Maven/Gradle
3. Configure bundling to serve Angular from Spring Boot static resources
4. Implement REST endpoints for todo operations
5. Implement Angular components and services

## Reference Materials

- Project specification: `resources/project.md` (German)
- UI mockups: `resources/screenshots/` (9 screenshots showing different app states)
- Base styling: `resources/css/main.css`
- TodoMVC reference: https://todomvc.com