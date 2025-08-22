# /fullstack-angular

---
description: Plan, implement, and test a complete full-stack feature end-to-end using Angular frontend and Spring Boot backend.
allowed-tools: Read, Grep, Glob, Edit, Write, MultiEdit, Bash(ng:*), Bash(npm:*), Bash(mvn:*), Bash(gradle:*), Bash(git:*), Bash(node:*), Bash(java:*)
---

## Context (auto-included)
- **Node.js**: Available (check with `node --version`)
- **Angular CLI**: Available (check with `ng version --skip-git`)
- **Java**: Available (check with `java --version`)
- **Maven**: Available (check with `./mvnw --version`)
- **Gradle**: Available (check with `./gradlew --version`)
- **Git Status**: Check with `git status -s`
- **Frontend Dependencies**: Check with `npm list --depth=0 --silent`
- **Backend Dependencies**: Check with `./mvnw dependency:tree -q`

## Your task

**IMPLEMENT COMPLETE FULL-STACK FEATURE WITH ANGULAR**: $ARGUMENTS

### Phase 1: Architecture Planning
1) Use the **angular-planner** agent to create `/frontend-plan.md` for: $ARGUMENTS
   - Include component hierarchy, services, models, routing, guards
   - Define Angular CLI commands needed
   - Plan integration with backend APIs
   - Design testing strategy

2) Use the **springboot-planner-agent** to create `/backend-plan.md` for: $ARGUMENTS
   - Include REST endpoints, DTOs, entities, repositories, services
   - Define database schema and migrations
   - Plan security configuration
   - Include Maven/Gradle dependencies and commands

### Phase 2: Backend Implementation
3) Use the **springboot-developer-agent** to implement the backend plan:
   - Create all Java classes (entities, repositories, services, controllers)
   - Implement REST API endpoints with proper validation
   - Configure security, exception handling, and database setup
   - Write initial unit and integration tests
   - Execute build commands: `./mvnw clean compile` or `./gradlew build`

### Phase 3: Angular Frontend Implementation  
4) Use the **angular-developer** agent to implement the frontend plan:
   - Create Angular components, services, and models
   - Implement routing and navigation with Angular Router
   - Connect to backend REST APIs using HttpClient
   - Create responsive UI with Angular Material or custom styles
   - Write component and service tests with Jasmine/Karma
   - Execute build commands: `ng build` and `ng test`

### Phase 4: Backend Quality Assurance
5) Use the **springboot-tester** agent to validate backend implementation:
   - Run complete test suite: `./mvnw test`
   - Execute integration tests with TestContainers
   - Validate security configuration and API contracts
   - Check code coverage and static analysis
   - Fix any test failures or quality issues
   - Run performance benchmarks

### Phase 5: Angular Frontend Quality Assurance
6) Use the **angular-tester** agent to validate frontend implementation:
   - Run unit tests: `ng test --watch=false --code-coverage`
   - Execute e2e tests: `ng e2e` or Cypress/Playwright
   - Test API integration and error handling
   - Validate accessibility and performance
   - Fix any test failures or UI issues
   - Ensure responsive design works correctly

### Phase 6: End-to-End Integration
7) **Integration Testing**:
   - Start backend application: `./mvnw spring-boot:run`
   - Start Angular application: `ng serve --proxy-config proxy.conf.json`
   - Test complete user workflows
   - Validate API contracts between Angular and Spring Boot
   - Test authentication/authorization flows if applicable
   - Performance testing of full-stack integration

### Phase 7: Documentation & Deployment Preparation
8) **Final Documentation**:
   - Update API documentation (OpenAPI/Swagger)
   - Create Angular deployment instructions (ng build --prod)
   - Document environment variables and configuration
   - Update README with Angular-specific setup instructions
   - Create feature documentation for end users

## Success Criteria

✅ **Backend Ready**:
- All REST endpoints implemented and tested
- Database schema created/migrated successfully  
- Security properly configured
- All tests passing (unit, integration, security)
- Code coverage > 85%
- No critical security vulnerabilities

✅ **Angular Frontend Ready**:
- All Angular components and services implemented
- Angular Forms and validation working
- RxJS observables properly managed
- HttpClient interceptors configured
- All Jasmine/Karma tests passing
- Code coverage > 80%
- Angular build optimized for production

✅ **Integration Complete**:
- Full user workflows tested end-to-end
- Angular proxy configuration working
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
- **Angular features implemented** (components, services, routing)
- **API endpoints created** with examples
- **Database changes** made
- **Test coverage achieved** (Karma + JUnit)
- **Angular bundle size and performance metrics**
- **Next steps** for deployment
- **Known limitations** or technical debt
- **Recommended follow-up tasks**

## Example Usage

```bash
/fullstack-angular "User Dashboard mit Benutzerstatistiken und Charts - soll Benutzerdaten anzeigen, Charts mit ng2-charts generieren und Export-Funktionalität bieten"
```

**IMPORTANT**: Each phase must complete successfully before proceeding to the next. Use git commits to checkpoint progress and enable easy rollback if needed.