# /fullstack-vue

---
description: Plan, implement, and test a complete full-stack feature end-to-end using Vue.js frontend and Spring Boot backend.
allowed-tools: Read, Grep, Glob, Edit, Write, MultiEdit, Bash(npm:*), Bash(pnpm:*), Bash(vue:*), Bash(vite:*), Bash(mvn:*), Bash(gradle:*), Bash(git:*), Bash(node:*), Bash(java:*)
---

## Context (auto-included)
- **Node.js**: Available (check with `node --version`)
- **Vue/Vite**: Available (check with `npm list vue vite --depth=0`)
- **Java**: Available (check with `java --version`)
- **Maven**: Available (check with `./mvnw --version`)
- **Gradle**: Available (check with `./gradlew --version`)
- **Git Status**: Check with `git status -s`
- **Frontend Dependencies**: Check with `npm list --depth=0 --silent`
- **Backend Dependencies**: Check with `./mvnw dependency:tree -q`

## Your task

**IMPLEMENT COMPLETE FULL-STACK FEATURE WITH VUE.JS**: $ARGUMENTS

### Phase 1: Architecture Planning (Parallel)
1) **Parallel Planning**: Use BOTH agents simultaneously to create comprehensive plans:
   
   **vue-planner** agent (parallel) → create `/frontend-plan.md` for: $ARGUMENTS
   - Include component hierarchy, composables, stores (Pinia), routing
   - Define Vite configuration and build setup
   - Plan integration with backend APIs
   - Design testing strategy with Vitest

   **springboot-planner-agent** (parallel) → create `/backend-plan.md` for: $ARGUMENTS
   - Include REST endpoints, DTOs, entities, repositories, services
   - Define database schema and migrations
   - Plan security configuration
   - Include Maven/Gradle dependencies and commands
   
   *Note: These planning phases are independent and can run simultaneously to save time*

### Phase 2: Backend Implementation
2) Use the **springboot-developer-agent** to implement the backend plan:
   - Create all Java classes (entities, repositories, services, controllers)
   - Implement REST API endpoints with proper validation
   - Configure security, exception handling, and database setup
   - Write initial unit and integration tests
   - Execute build commands: `./mvnw clean compile` or `./gradlew build`

### Phase 3: Vue Frontend Implementation  
3) Use the **vue-developer** agent to implement the frontend plan:
   - Create Vue Single File Components (SFCs)
   - Implement composables for shared logic
   - Set up Pinia stores for state management
   - Configure Vue Router for navigation
   - Connect to backend APIs using Axios or Fetch
   - Create responsive UI with CSS/SCSS or UI libraries
   - Write component tests with Vitest and Vue Test Utils
   - Execute build commands: `npm run build` and `npm run test`

### Phase 4: Quality Assurance (Parallel)
4) **Parallel Testing**: Use BOTH testers simultaneously to validate implementations:

   **springboot-tester** agent (parallel) → validate backend implementation:
   - Run complete test suite: `./mvnw test`
   - Execute integration tests with TestContainers
   - Validate security configuration and API contracts
   - Check code coverage and static analysis
   - Fix any test failures or quality issues
   - Run performance benchmarks

   **vue-tester** agent (parallel) → validate frontend implementation:
   - Run unit tests: `npm run test:unit -- --coverage`
   - Execute e2e tests with Playwright or Cypress
   - Test API integration and error handling
   - Validate accessibility and performance
   - Fix any test failures or UI issues
   - Ensure responsive design works correctly
   - Check Vue DevTools for reactivity issues
   
   *Note: Both test suites can run independently to save time*

### Phase 5: End-to-End Integration
5) **Integration Testing**:
   - Start backend application: `./mvnw spring-boot:run`
   - Start Vue development server: `npm run dev` (with Vite proxy)
   - Test complete user workflows
   - Validate API contracts between Vue and Spring Boot
   - Test authentication/authorization flows if applicable
   - Performance testing of full-stack integration

### Phase 6: Documentation & Deployment Preparation
6) **Final Documentation**:
   - Update API documentation (OpenAPI/Swagger)
   - Create Vue deployment instructions (npm run build)
   - Document environment variables (.env configuration)
   - Update README with Vue-specific setup instructions
   - Create feature documentation for end users

## Success Criteria

✅ **Backend Ready**:
- All REST endpoints implemented and tested
- Database schema created/migrated successfully  
- Security properly configured
- All tests passing (unit, integration, security)
- Code coverage > 85%
- No critical security vulnerabilities

✅ **Vue Frontend Ready**:
- All Vue components and composables implemented
- Pinia stores properly structured
- Vue Router navigation working
- Form validation with VeeValidate or custom validators
- All Vitest tests passing
- Code coverage > 80%
- Vite build optimized for production

✅ **Integration Complete**:
- Full user workflows tested end-to-end
- Vite proxy configuration working
- Error handling working across the stack
- Authentication/authorization functioning
- No console errors or warnings
- Application deployable to target environment

## Rollback Strategy

If any phase fails:
1. **Git commit** successful phases separately
2. **Document issues** encountered for future reference
3. **Provide recovery commands** to restore working state
4. **Suggest alternative approaches** for problematic areas

## Final Summary

Provide comprehensive summary including:
- **Vue features implemented** (components, composables, stores)
- **API endpoints created** with examples
- **Database changes** made
- **Test coverage achieved** (Vitest + JUnit)
- **Vite bundle size and performance metrics**
- **Next steps** for deployment
- **Known limitations** or technical debt
- **Recommended follow-up tasks**

## Example Usage

```bash
/fullstack-vue "User Dashboard mit Benutzerstatistiken und Charts - soll Benutzerdaten anzeigen, Charts mit Chart.js generieren und Export-Funktionalität bieten"
```

**IMPORTANT**: Each phase must complete successfully before proceeding to the next. Use git commits to checkpoint progress and enable easy rollback if needed.