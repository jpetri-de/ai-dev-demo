# TodoMVC Multi-stage Docker Build
# This Dockerfile creates a production-ready container with both frontend and backend

# ======================================
# Stage 1: Frontend Build
# ======================================
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app/frontend

# Copy package files
COPY todo-frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy frontend source
COPY todo-frontend/ ./

# Build frontend for production
RUN npm run build:prod

# ======================================
# Stage 2: Backend Build
# ======================================
FROM maven:3.9-openjdk-17-slim AS backend-builder

# Set working directory
WORKDIR /app/backend

# Copy Maven files
COPY todo-backend/pom.xml ./
COPY todo-backend/.mvn .mvn/
COPY todo-backend/mvnw ./

# Download dependencies (for better Docker layer caching)
RUN mvn dependency:go-offline -B

# Copy backend source
COPY todo-backend/src ./src/

# Copy frontend build to static resources
COPY --from=frontend-builder /app/frontend/dist/todo-frontend ./src/main/resources/static/

# Build backend
RUN mvn clean package -Pprod -DskipTests=true

# ======================================
# Stage 3: Production Runtime
# ======================================
FROM openjdk:17-jre-slim AS production

# Install security updates and required packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create application user and group
RUN groupadd --system todoapp && \
    useradd --system --shell /bin/false --home /app --gid todoapp todoapp

# Create application directories
RUN mkdir -p /app/logs /app/config /app/data && \
    chown -R todoapp:todoapp /app

# Set working directory
WORKDIR /app

# Copy application JAR
COPY --from=backend-builder /app/backend/target/*.jar ./todoapp.jar

# Copy configuration files
COPY docker/application-prod.properties ./config/
COPY docker/logback-spring.xml ./config/

# Create startup script
RUN cat > start.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting TodoMVC Application..."
echo "Java Version: $(java -version 2>&1 | head -n 1)"
echo "Available Memory: $(free -h | grep Mem | awk '{print $2}')"
echo "Disk Space: $(df -h /app | tail -1 | awk '{print $4}' | grep -v Filesystem)"

# Wait for any dependencies if needed
if [ ! -z "$WAIT_FOR" ]; then
    echo "Waiting for dependencies: $WAIT_FOR"
    for dependency in $(echo $WAIT_FOR | tr "," "\n"); do
        echo "Waiting for $dependency..."
        while ! nc -z $dependency 2>/dev/null; do
            sleep 1
        done
        echo "$dependency is ready"
    done
fi

# JVM Configuration
JAVA_OPTS="${JAVA_OPTS:--Xmx1g -Xms512m}"
JAVA_OPTS="$JAVA_OPTS -XX:+UseContainerSupport"
JAVA_OPTS="$JAVA_OPTS -XX:MaxRAMPercentage=75.0"
JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"
JAVA_OPTS="$JAVA_OPTS -XX:+UseStringDeduplication"
JAVA_OPTS="$JAVA_OPTS -Djava.security.egd=file:/dev/./urandom"
JAVA_OPTS="$JAVA_OPTS -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod}"
JAVA_OPTS="$JAVA_OPTS -Dlogging.config=/app/config/logback-spring.xml"

echo "Java Options: $JAVA_OPTS"
echo "Spring Profile: ${SPRING_PROFILES_ACTIVE:-prod}"
echo "Server Port: ${SERVER_PORT:-8080}"

# Start application
exec java $JAVA_OPTS -jar todoapp.jar \
    --spring.config.location=classpath:/application.properties,file:/app/config/ \
    --server.port=${SERVER_PORT:-8080}
EOF

RUN chmod +x start.sh && chown todoapp:todoapp start.sh

# Switch to application user
USER todoapp

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Labels for metadata
LABEL maintainer="TodoMVC Team" \
      version="1.0.0" \
      description="TodoMVC Full-Stack Application" \
      org.opencontainers.image.title="TodoMVC" \
      org.opencontainers.image.description="Modern TodoMVC application with Spring Boot and Angular" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.created="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
      org.opencontainers.image.source="https://github.com/your-org/todomvc"

# Default command
CMD ["./start.sh"]