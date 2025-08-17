# Backend Implementation Plan - Feature 01: Backend Setup

## Context

This plan implements Feature 01: Backend Setup for the TodoMVC application. The goal is to create a basic Spring Boot 3.2 backend application with Java 17 and Maven that serves as the foundation for all subsequent API features.

**Business Requirements:**
- Create stable Spring Boot backend infrastructure
- Enable health monitoring via actuator endpoints
- Prepare CORS configuration for future frontend integration
- Establish Maven build pipeline

## API Design

### Health Check Endpoint
```yaml
openapi: 3.0.3
info:
  title: TodoMVC Backend API
  version: 1.0.0
paths:
  /actuator/health:
    get:
      summary: Health check endpoint
      responses:
        '200':
          description: Application is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "UP"
```

### CORS Configuration
- **Allowed Origins**: http://localhost:4200 (Angular dev server)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization, X-Requested-With

## Data Model

No data model required for this initial setup. The focus is on infrastructure and basic health monitoring.

## Architecture

### Layer Structure
```
Application Layer
├── TodoBackendApplication.java (Main entry point)
└── Configuration Layer (Future CORS config)

Infrastructure Layer
├── Spring Boot Actuator (Health checks)
└── Spring Web (Future REST endpoints)
```

### Dependency Flow
- Spring Boot Starter Web → Embedded Tomcat + Spring MVC
- Spring Boot Actuator → Health endpoints + Metrics
- Spring Boot DevTools → Hot reloading during development

### Patterns Applied
- **Auto-Configuration**: Leverage Spring Boot's automatic configuration
- **Convention over Configuration**: Use default Spring Boot conventions
- **Health Check Pattern**: Actuator endpoints for monitoring

## Security

### Current Security Measures
- Default Spring Security (if needed in future)
- CORS preparation for localhost:4200
- Input validation framework setup (for future endpoints)

### Future Security Considerations
- JWT token authentication (for protected endpoints)
- Request rate limiting
- Input sanitization and validation

## Implementation

### File Structure
```
todo-backend/
├── pom.xml                                    # Maven configuration
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/todobackend/
│   │   │       ├── TodoBackendApplication.java    # Main application class
│   │   │       └── config/                        # Future configuration classes
│   │   └── resources/
│   │       ├── application.properties              # Application configuration
│   │       └── application-dev.properties          # Development profile
│   └── test/
│       └── java/
│           └── com/example/todobackend/
│               └── TodoBackendApplicationTests.java # Integration tests
```

### 1. Maven Configuration (pom.xml)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <groupId>com.example</groupId>
    <artifactId>todo-backend</artifactId>
    <version>1.0.0</version>
    <name>todo-backend</name>
    <description>TodoMVC Backend Application</description>
    
    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
    </properties>
    
    <dependencies>
        <!-- Spring Boot Web Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- Spring Boot Actuator for Health Checks -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        
        <!-- Development Tools -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
        
        <!-- Test Dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 2. Main Application Class
**File**: `src/main/java/com/example/todobackend/TodoBackendApplication.java`
```java
package com.example.todobackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TodoBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TodoBackendApplication.class, args);
    }
}
```

### 3. Application Configuration
**File**: `src/main/resources/application.properties`
```properties
# Server Configuration
server.port=8080
server.servlet.context-path=/

# Application Info
spring.application.name=todo-backend
info.app.name=TodoMVC Backend
info.app.description=Spring Boot backend for TodoMVC application
info.app.version=1.0.0

# Actuator Configuration
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=when-authorized
management.endpoints.web.base-path=/actuator

# CORS Configuration (prepared for frontend)
# Note: Will be implemented via @CrossOrigin or WebMvcConfigurer in future features
cors.allowed-origins=http://localhost:4200
cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
cors.allowed-headers=Content-Type,Authorization,X-Requested-With

# Logging Configuration
logging.level.com.example.todobackend=INFO
logging.level.org.springframework.web=DEBUG
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n

# Development Profile Activation
spring.profiles.active=dev
```

**File**: `src/main/resources/application-dev.properties`
```properties
# Development-specific configuration
logging.level.org.springframework.web=DEBUG
spring.devtools.restart.enabled=true
spring.devtools.livereload.enabled=true
```

### 4. CORS Configuration Class (Future-ready)
**File**: `src/main/java/com/example/todobackend/config/CorsConfig.java`
```java
package com.example.todobackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${cors.allowed-methods}")
    private String allowedMethods;

    @Value("${cors.allowed-headers}")
    private String allowedHeaders;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        configuration.setAllowedMethods(Arrays.asList(allowedMethods.split(",")));
        configuration.setAllowedHeaders(Arrays.asList(allowedHeaders.split(",")));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

## Testing

### Test Strategy
1. **Unit Tests**: Not applicable for this infrastructure setup
2. **Integration Tests**: Verify application startup and health endpoint
3. **Health Check Tests**: Validate actuator endpoints respond correctly

### Test Implementation
**File**: `src/test/java/com/example/todobackend/TodoBackendApplicationTests.java`
```java
package com.example.todobackend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class TodoBackendApplicationTests {

    @LocalServerPort
    private int port;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    void contextLoads() {
        // Verify Spring context loads successfully
    }

    @Test
    void healthCheckEndpointReturnsOk() {
        String url = "http://localhost:" + port + "/actuator/health";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("UP");
    }

    @Test
    void applicationStartsOnCorrectPort() {
        String url = "http://localhost:" + port + "/actuator/health";
        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
```

### Test Configuration
**File**: `src/test/resources/application-test.properties`
```properties
# Test-specific configuration
spring.profiles.active=test
server.port=0
logging.level.org.springframework.web=WARN
```

## Deployment

### Maven Commands
```bash
# Clean and compile
mvn clean compile

# Run tests
mvn test

# Package application
mvn clean package

# Run application (development)
mvn spring-boot:run

# Run application (production JAR)
java -jar target/todo-backend-1.0.0.jar

# Run with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev
java -jar target/todo-backend-1.0.0.jar --spring.profiles.active=prod
```

### Configuration Profiles
- **dev**: Development profile with debug logging and DevTools
- **test**: Test profile with minimal logging
- **prod**: Production profile (to be defined in future features)

### Monitoring Endpoints
- **Health Check**: GET http://localhost:8080/actuator/health
- **Application Info**: GET http://localhost:8080/actuator/info

## Implementation Checklist

### Project Structure Setup
- [ ] Create todo-backend directory
- [ ] Initialize Maven project structure
- [ ] Create src/main/java/com/example/todobackend package
- [ ] Create src/main/resources directory
- [ ] Create src/test/java/com/example/todobackend package

### Maven Configuration
- [ ] Create pom.xml with Spring Boot 3.2 parent
- [ ] Add spring-boot-starter-web dependency
- [ ] Add spring-boot-starter-actuator dependency
- [ ] Add spring-boot-devtools dependency (dev scope)
- [ ] Add spring-boot-starter-test dependency (test scope)
- [ ] Configure Java 17 compilation target

### Application Setup
- [ ] Create TodoBackendApplication.java main class
- [ ] Add @SpringBootApplication annotation
- [ ] Implement main method with SpringApplication.run()

### Configuration Files
- [ ] Create application.properties with port 8080
- [ ] Configure actuator endpoints (health, info)
- [ ] Add application info properties
- [ ] Create application-dev.properties for development
- [ ] Prepare CORS configuration properties

### Testing Setup
- [ ] Create TodoBackendApplicationTests.java
- [ ] Implement context loading test
- [ ] Implement health check endpoint test
- [ ] Create application-test.properties

### Verification Steps
- [ ] Run `mvn clean compile` successfully
- [ ] Run `mvn test` with all tests passing
- [ ] Run `mvn spring-boot:run` and verify startup
- [ ] Verify health endpoint: GET http://localhost:8080/actuator/health returns 200
- [ ] Verify application info: GET http://localhost:8080/actuator/info returns application details

### Build and Run Commands
```bash
# Initial project setup
mkdir todo-backend
cd todo-backend

# Verify Java 17 is available
java -version

# Build and test
mvn clean install

# Run application
mvn spring-boot:run

# Verify health endpoint
curl http://localhost:8080/actuator/health

# Verify info endpoint
curl http://localhost:8080/actuator/info
```

## Risks

### Performance Bottlenecks
- **Startup Time**: Spring Boot 3.2 with Java 17 has optimized startup
- **Memory Usage**: Base Spring Boot app uses ~150MB RAM
- **Mitigation**: Use Spring Boot's lazy initialization if needed

### Security Concerns
- **Actuator Endpoints**: Health endpoint exposed without authentication
- **CORS**: Prepared for localhost:4200 only
- **Mitigation**: Secure actuator endpoints in production profile

### Scalability Considerations
- **Port Conflicts**: Default port 8080 may conflict
- **Resource Limits**: Configure appropriate JVM heap size
- **Mitigation**: Use environment-specific configuration

### Development Risks
- **Java Version Mismatch**: Ensure Java 17 is installed
- **Maven Dependencies**: Network issues during dependency download
- **Hot Reloading**: DevTools conflicts with certain IDEs

This plan provides a complete foundation for implementing the TodoMVC backend with Spring Boot 3.2, following the exact specifications while preparing for future feature development.
