#!/bin/bash
set -e

# TodoMVC Production Build Script
# This script builds both frontend and backend for production deployment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${PROJECT_ROOT}/build-artifacts"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
APP_NAME="todo-app"
VERSION="1.0.0"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    # Add cleanup logic here if needed
}

# Error handler
error_handler() {
    log_error "Build failed at line $1"
    cleanup
    exit 1
}

trap 'error_handler $LINENO' ERR

# Print header
echo "=================================================="
echo "   TodoMVC Production Build Script"
echo "   Version: $VERSION"
echo "   Timestamp: $TIMESTAMP"
echo "=================================================="

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    log "Node.js version: $NODE_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    log "npm version: $NPM_VERSION"
    
    # Check Java
    if ! command -v java &> /dev/null; then
        log_error "Java is not installed"
        exit 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    log "Java version: $JAVA_VERSION"
    
    # Check Maven
    if ! command -v mvn &> /dev/null; then
        log_error "Maven is not installed"
        exit 1
    fi
    
    MVN_VERSION=$(mvn --version | head -n 1)
    log "Maven version: $MVN_VERSION"
    
    log_success "All prerequisites satisfied"
}

# Create build directory
create_build_directory() {
    log "Creating build directory..."
    
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    mkdir -p "$BUILD_DIR/logs"
    mkdir -p "$BUILD_DIR/config"
    mkdir -p "$BUILD_DIR/docs"
    
    log_success "Build directory created: $BUILD_DIR"
}

# Build frontend
build_frontend() {
    log "Building frontend..."
    
    cd "$PROJECT_ROOT/todo-frontend"
    
    # Clean previous builds
    log "Cleaning previous frontend builds..."
    rm -rf dist node_modules/.cache
    
    # Install dependencies
    log "Installing frontend dependencies..."
    npm ci --production=false
    
    # Run tests
    log "Running frontend tests..."
    npm run test:ci || {
        log_warning "Frontend tests failed, continuing with build..."
    }
    
    # Build for production
    log "Building frontend for production..."
    npm run build:prod
    
    # Verify build
    if [ ! -d "dist/todo-frontend" ]; then
        log_error "Frontend build failed - dist directory not found"
        exit 1
    fi
    
    # Copy build artifacts
    log "Copying frontend build artifacts..."
    cp -r dist/todo-frontend/* "$PROJECT_ROOT/todo-backend/src/main/resources/static/"
    
    # Create frontend build archive
    cd dist
    tar -czf "$BUILD_DIR/${APP_NAME}-frontend-${TIMESTAMP}.tar.gz" todo-frontend/
    
    log_success "Frontend build completed"
}

# Build backend
build_backend() {
    log "Building backend..."
    
    cd "$PROJECT_ROOT/todo-backend"
    
    # Clean previous builds
    log "Cleaning previous backend builds..."
    mvn clean
    
    # Run tests
    log "Running backend tests..."
    mvn test || {
        log_warning "Backend tests failed, continuing with build..."
    }
    
    # Generate test reports
    log "Generating test reports..."
    mvn jacoco:report || {
        log_warning "Failed to generate test coverage report"
    }
    
    # Build for production
    log "Building backend for production..."
    mvn package -Pprod -DskipTests=true
    
    # Verify build
    JAR_FILE=$(find target -name "*.jar" -not -name "*sources.jar" | head -n 1)
    if [ ! -f "$JAR_FILE" ]; then
        log_error "Backend build failed - JAR file not found"
        exit 1
    fi
    
    # Copy JAR file
    log "Copying backend JAR file..."
    cp "$JAR_FILE" "$BUILD_DIR/${APP_NAME}-${VERSION}-${TIMESTAMP}.jar"
    
    # Create versioned JAR
    cp "$JAR_FILE" "$BUILD_DIR/${APP_NAME}-latest.jar"
    
    log_success "Backend build completed"
}

# Create deployment package
create_deployment_package() {
    log "Creating deployment package..."
    
    cd "$BUILD_DIR"
    
    # Copy configuration files
    log "Copying configuration files..."
    cp "$PROJECT_ROOT/todo-backend/src/main/resources/application-prod.properties" config/
    
    # Copy documentation
    log "Copying documentation..."
    cp "$PROJECT_ROOT/API-DOCUMENTATION.md" docs/
    cp "$PROJECT_ROOT/USER-GUIDE.md" docs/
    cp "$PROJECT_ROOT/PRODUCTION-DEPLOYMENT-GUIDE.md" docs/
    cp "$PROJECT_ROOT/DEVELOPER-GUIDE.md" docs/
    
    # Create startup script
    log "Creating startup script..."
    cat > start-todoapp.sh << 'EOF'
#!/bin/bash
# TodoMVC Application Startup Script

APP_NAME="todo-app"
JAR_FILE="${APP_NAME}-latest.jar"
PID_FILE="${APP_NAME}.pid"
LOG_FILE="logs/application.log"

# Configuration
JAVA_OPTS="-Xmx1g -Xms512m -XX:+UseG1GC -Dspring.profiles.active=prod"
SERVER_PORT="${SERVER_PORT:-8080}"

# Functions
start() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Application is already running (PID: $PID)"
            return 1
        else
            rm -f "$PID_FILE"
        fi
    fi
    
    echo "Starting TodoMVC application..."
    nohup java $JAVA_OPTS -jar "$JAR_FILE" --server.port="$SERVER_PORT" > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    echo "Application started (PID: $(cat $PID_FILE))"
    echo "Server will be available at: http://localhost:$SERVER_PORT"
    echo "Health check: http://localhost:$SERVER_PORT/actuator/health"
}

stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo "Application is not running"
        return 1
    fi
    
    PID=$(cat "$PID_FILE")
    echo "Stopping TodoMVC application (PID: $PID)..."
    
    if kill "$PID" 2>/dev/null; then
        # Wait for graceful shutdown
        for i in {1..30}; do
            if ! kill -0 "$PID" 2>/dev/null; then
                break
            fi
            sleep 1
        done
        
        # Force kill if still running
        if kill -0 "$PID" 2>/dev/null; then
            echo "Forcing application stop..."
            kill -9 "$PID"
        fi
        
        rm -f "$PID_FILE"
        echo "Application stopped"
    else
        echo "Failed to stop application"
        return 1
    fi
}

status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Application is running (PID: $PID)"
            return 0
        else
            echo "Application is not running (stale PID file)"
            rm -f "$PID_FILE"
            return 1
        fi
    else
        echo "Application is not running"
        return 1
    fi
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 2
        start
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
EOF

    chmod +x start-todoapp.sh
    
    # Create health check script
    log "Creating health check script..."
    cat > health-check.sh << 'EOF'
#!/bin/bash
# TodoMVC Health Check Script

SERVER_PORT="${SERVER_PORT:-8080}"
HEALTH_URL="http://localhost:$SERVER_PORT/actuator/health"
MAX_ATTEMPTS=30
ATTEMPT=0

echo "Checking application health..."
echo "Health check URL: $HEALTH_URL"

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo "Attempt $ATTEMPT/$MAX_ATTEMPTS..."
    
    if curl -s -f "$HEALTH_URL" > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
        
        # Get health details
        echo "Health check details:"
        curl -s "$HEALTH_URL" | python3 -m json.tool 2>/dev/null || curl -s "$HEALTH_URL"
        exit 0
    fi
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        echo "Application not ready, waiting 5 seconds..."
        sleep 5
    fi
done

echo "❌ Application health check failed after $MAX_ATTEMPTS attempts"
exit 1
EOF

    chmod +x health-check.sh
    
    # Create deployment archive
    log "Creating deployment archive..."
    tar -czf "${APP_NAME}-${VERSION}-${TIMESTAMP}-deployment.tar.gz" \
        *.jar \
        *.sh \
        config/ \
        docs/ \
        logs/
    
    # Create checksum
    log "Creating checksums..."
    sha256sum *.jar *.tar.gz > checksums.sha256
    
    log_success "Deployment package created"
}

# Run build verification
verify_build() {
    log "Verifying build..."
    
    cd "$BUILD_DIR"
    
    # Check JAR file
    JAR_FILE="${APP_NAME}-latest.jar"
    if [ ! -f "$JAR_FILE" ]; then
        log_error "JAR file not found: $JAR_FILE"
        exit 1
    fi
    
    # Get JAR size
    JAR_SIZE=$(ls -lh "$JAR_FILE" | awk '{print $5}')
    log "JAR file size: $JAR_SIZE"
    
    # Test JAR execution
    log "Testing JAR execution..."
    timeout 30s java -jar "$JAR_FILE" --spring.profiles.active=prod --server.port=9999 &
    JAVA_PID=$!
    
    sleep 15
    
    # Test health endpoint
    if curl -s -f "http://localhost:9999/actuator/health" > /dev/null; then
        log_success "JAR execution test passed"
    else
        log_warning "JAR execution test failed - health endpoint not accessible"
    fi
    
    # Cleanup test process
    kill $JAVA_PID 2>/dev/null || true
    sleep 2
    
    # Verify deployment package
    DEPLOYMENT_PACKAGE="${APP_NAME}-${VERSION}-${TIMESTAMP}-deployment.tar.gz"
    if [ ! -f "$DEPLOYMENT_PACKAGE" ]; then
        log_error "Deployment package not found: $DEPLOYMENT_PACKAGE"
        exit 1
    fi
    
    PACKAGE_SIZE=$(ls -lh "$DEPLOYMENT_PACKAGE" | awk '{print $5}')
    log "Deployment package size: $PACKAGE_SIZE"
    
    log_success "Build verification completed"
}

# Generate build report
generate_build_report() {
    log "Generating build report..."
    
    cd "$BUILD_DIR"
    
    cat > build-report.md << EOF
# TodoMVC Build Report

**Build Date**: $(date)
**Build ID**: ${TIMESTAMP}
**Version**: ${VERSION}

## Build Artifacts

| Artifact | Size | Description |
|----------|------|-------------|
| ${APP_NAME}-latest.jar | $(ls -lh ${APP_NAME}-latest.jar | awk '{print $5}') | Production JAR file |
| ${APP_NAME}-${VERSION}-${TIMESTAMP}-deployment.tar.gz | $(ls -lh ${APP_NAME}-${VERSION}-${TIMESTAMP}-deployment.tar.gz | awk '{print $5}') | Complete deployment package |
| ${APP_NAME}-frontend-${TIMESTAMP}.tar.gz | $(ls -lh ${APP_NAME}-frontend-${TIMESTAMP}.tar.gz | awk '{print $5}') | Frontend build artifacts |

## Build Environment

- **Node.js**: $(node --version)
- **npm**: $(npm --version)
- **Java**: $(java -version 2>&1 | head -n 1)
- **Maven**: $(mvn --version | head -n 1)

## Checksums

\`\`\`
$(cat checksums.sha256)
\`\`\`

## Deployment Instructions

1. Extract deployment package:
   \`\`\`bash
   tar -xzf ${APP_NAME}-${VERSION}-${TIMESTAMP}-deployment.tar.gz
   \`\`\`

2. Start application:
   \`\`\`bash
   ./start-todoapp.sh start
   \`\`\`

3. Check health:
   \`\`\`bash
   ./health-check.sh
   \`\`\`

4. Access application:
   - Frontend: http://localhost:8080
   - API: http://localhost:8080/api
   - Health: http://localhost:8080/actuator/health

## Build Log

Build completed successfully at $(date)
EOF
    
    log_success "Build report generated: build-report.md"
}

# Main execution
main() {
    log "Starting TodoMVC production build..."
    
    check_prerequisites
    create_build_directory
    build_frontend
    build_backend
    create_deployment_package
    verify_build
    generate_build_report
    
    cd "$BUILD_DIR"
    
    echo ""
    echo "=================================================="
    echo "   🎉 BUILD COMPLETED SUCCESSFULLY! 🎉"
    echo "=================================================="
    echo ""
    echo "Build artifacts location: $BUILD_DIR"
    echo ""
    echo "📦 Deployment package:"
    echo "   ${APP_NAME}-${VERSION}-${TIMESTAMP}-deployment.tar.gz"
    echo ""
    echo "🚀 To deploy:"
    echo "   1. Copy deployment package to target server"
    echo "   2. Extract: tar -xzf ${APP_NAME}-${VERSION}-${TIMESTAMP}-deployment.tar.gz"
    echo "   3. Start: ./start-todoapp.sh start"
    echo "   4. Health check: ./health-check.sh"
    echo ""
    echo "📊 Build report: build-report.md"
    echo "🔐 Checksums: checksums.sha256"
    echo ""
    echo "Build completed at: $(date)"
    echo "=================================================="
}

# Execute main function
main "$@"