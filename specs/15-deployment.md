# Feature 15: Deployment & Bundling

## Ziel
Production-ready Deployment als Single JAR mit Frontend und Spring Boot Backend gebündelt.

## Beschreibung
Finalisierung des Deployment-Prozesses mit Frontend Production-Build, Integration in Spring Boot Static Resources, Build-Pipeline und ausführbarer JAR-Erstellung.

## Akzeptanzkriterien

### Frontend Production Build
- [ ] Optimierter Frontend Build für Production
- [ ] Code Minification und Tree Shaking
- [ ] Bundle Optimization und Lazy Loading
- [ ] Asset Optimization (CSS, Images)

### Spring Boot Integration
- [ ] Frontend Build-Output in `src/main/resources/static/`
- [ ] Static Resource Handling konfiguriert
- [ ] SPA Routing Support (Fallback zu index.html)
- [ ] MIME-Type Konfiguration

### Maven Build Pipeline
- [ ] Frontend Build als Maven Phase integriert
- [ ] Automatische Dependency Installation
- [ ] Build-Reihenfolge: Frontend → Backend → Package
- [ ] Clean Build Support

### Single JAR Deployment
- [ ] Ausführbare JAR-Datei mit embedded Tomcat
- [ ] Alle Static Assets embedded
- [ ] Production-ready Konfiguration
- [ ] Startup-Scripts und Health Checks

## Technische Spezifikationen

### Maven Frontend Plugin Configuration
```xml
<plugin>
    <groupId>com.github.eirslett</groupId>
    <artifactId>frontend-maven-plugin</artifactId>
    <version>1.12.1</version>
    <configuration>
        <workingDirectory>frontend</workingDirectory>
        <installDirectory>target</installDirectory>
    </configuration>
    <executions>
        <!-- Install Node and npm -->
        <execution>
            <id>install node and npm</id>
            <goals>
                <goal>install-node-and-npm</goal>
            </goals>
            <configuration>
                <nodeVersion>v18.17.0</nodeVersion>
                <npmVersion>9.6.7</npmVersion>
            </configuration>
        </execution>
        
        <!-- Install npm dependencies -->
        <execution>
            <id>npm install</id>
            <goals>
                <goal>npm</goal>
            </goals>
            <configuration>
                <arguments>ci</arguments>
            </configuration>
        </execution>
        
        <!-- Build Frontend app -->
        <execution>
            <id>npm run build</id>
            <goals>
                <goal>npm</goal>
            </goals>
            <configuration>
                <arguments>run build</arguments>
            </configuration>
        </execution>
    </executions>
</plugin>

<!-- Copy Frontend build to Spring Boot static resources -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-resources-plugin</artifactId>
    <version>3.2.0</version>
    <executions>
        <execution>
            <id>copy-angular-build</id>
            <phase>process-resources</phase>
            <goals>
                <goal>copy-resources</goal>
            </goals>
            <configuration>
                <outputDirectory>${project.build.directory}/classes/static</outputDirectory>
                <resources>
                    <resource>
                        <directory>frontend/dist/todo-frontend</directory>
                        <filtering>false</filtering>
                    </resource>
                </resources>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### Spring Boot Static Resource Configuration
```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Static resources for Frontend app
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(31556926) // 1 year cache for production
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        
                        // If resource exists, serve it
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        
                        // Fallback to index.html for SPA routing
                        return location.createRelative("index.html");
                    }
                });
    }
    
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Forward all non-API routes to index.html for SPA
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}
```

### Application Properties (Production)
```properties
# application-prod.properties

# Server configuration
server.port=8080
server.compression.enabled=true
server.compression.mime-types=text/html,text/xml,text/plain,text/css,text/javascript,application/javascript,application/json
server.http2.enabled=true

# Logging configuration
logging.level.root=WARN
logging.level.com.example.todobackend=INFO
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n
logging.pattern.file=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n

# Actuator endpoints
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=when-authorized

# Static resource optimization
spring.web.resources.cache.cachecontrol.max-age=365d
spring.web.resources.chain.strategy.content.enabled=true
spring.web.resources.chain.strategy.content.paths=/**
```

### Frontend Production Configuration

#### Angular:
```json
// angular.json - production configuration
{
  "configurations": {
    "production": {
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "500kb",
          "maximumError": "1mb"
        }
      ],
      "outputHashing": "all",
      "optimization": true,
      "sourceMap": false,
      "aot": true,
      "buildOptimizer": true
    }
  }
}
```

#### Vue (Vite):
```javascript
// vite.config.js
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
})
```

#### React:
```json
// package.json scripts
{
  "scripts": {
    "build": "react-scripts build",
    "build:analyze": "source-map-explorer 'build/static/js/*.js'"
  }
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "ng": "ng",
    "start": "ng serve --proxy-config proxy.conf.json",
    "build": "ng build --configuration production",
    "build:dev": "ng build",
    "test": "ng test",
    "lint": "ng lint",
    "e2e": "ng e2e"
  }
}
```

### Maven Build Profiles
```xml
<profiles>
    <!-- Development Profile -->
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <spring.profiles.active>dev</spring.profiles.active>
        </properties>
    </profile>
    
    <!-- Production Profile -->
    <profile>
        <id>prod</id>
        <properties>
            <spring.profiles.active>prod</spring.profiles.active>
        </properties>
        <build>
            <plugins>
                <!-- Frontend build only in production -->
                <plugin>
                    <groupId>com.github.eirslett</groupId>
                    <artifactId>frontend-maven-plugin</artifactId>
                    <!-- Configuration as above -->
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```

### Docker Support (Optional)
```dockerfile
# Dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy JAR file
COPY target/todo-app.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Startup Scripts
```bash
#!/bin/bash
# start.sh

JAR_FILE="todo-app.jar"
PID_FILE="app.pid"

if [ -f $PID_FILE ]; then
    echo "Application is already running with PID $(cat $PID_FILE)"
    exit 1
fi

echo "Starting Todo Application..."
nohup java -jar $JAR_FILE --spring.profiles.active=prod > app.log 2>&1 &
echo $! > $PID_FILE
echo "Application started with PID $(cat $PID_FILE)"
```

```bash
#!/bin/bash
# stop.sh

PID_FILE="app.pid"

if [ ! -f $PID_FILE ]; then
    echo "PID file not found. Application may not be running."
    exit 1
fi

PID=$(cat $PID_FILE)
echo "Stopping application with PID $PID..."
kill $PID

# Wait for graceful shutdown
sleep 5

if kill -0 $PID 2>/dev/null; then
    echo "Force killing application..."
    kill -9 $PID
fi

rm -f $PID_FILE
echo "Application stopped."
```

## Build Commands

### Development Build
```bash
# Backend only (for development with ng serve)
mvn clean compile spring-boot:run

# Frontend only (with proxy to backend)
cd frontend
npm install
npm start
```

### Production Build
```bash
# Full production build
mvn clean package -Pprod

# Run production JAR
java -jar target/todo-app.jar --spring.profiles.active=prod
```

### Docker Build (Optional)
```bash
# Build Docker image
docker build -t todo-app .

# Run Docker container
docker run -p 8080:8080 todo-app
```

## Testfälle

### Build Process
- [ ] `mvn clean package -Pprod` → Erfolgreicher Build
- [ ] Frontend Production Build → Optimierte Bundle-Größe
- [ ] Static Resources → Korrekt in JAR embedded
- [ ] JAR ausführbar → Startet ohne Fehler

### Production Deployment
- [ ] JAR Start → Alle Features funktional
- [ ] Static File Serving → CSS/JS korrekt geladen
- [ ] SPA Routing → Direkter URL-Zugriff funktioniert
- [ ] API Endpoints → Alle erreichbar unter /api/*

### Performance
- [ ] Bundle Size → Unter definierten Limits
- [ ] Initial Load Time → Optimiert
- [ ] Resource Caching → Korrekte Cache-Headers
- [ ] Compression → GZIP aktiviert

### Health Checks
- [ ] `/actuator/health` → Status OK
- [ ] Application Startup → Unter 30 Sekunden
- [ ] Memory Usage → Im erwarteten Bereich
- [ ] CPU Usage → Effizient

### Error Scenarios
- [ ] Port bereits belegt → Graceful Error
- [ ] Insufficient Memory → Clear Error Message
- [ ] Missing Dependencies → Build Failure mit Details

## Production Checklist

### Security
- [ ] Production Secrets externalisiert
- [ ] Debug-Logs deaktiviert
- [ ] Actuator Endpoints gesichert
- [ ] HTTPS konfiguriert (wenn erforderlich)

### Monitoring
- [ ] Application Metrics verfügbar
- [ ] Health Check Endpoint funktional
- [ ] Log Rotation konfiguriert
- [ ] Error Tracking implementiert

### Performance
- [ ] Bundle Size optimiert
- [ ] Resource Compression aktiviert
- [ ] Cache-Strategien implementiert
- [ ] Database Connection Pooling (falls relevant)

## Definition of Done
- [ ] Build Pipeline produziert ausführbare JAR
- [ ] Frontend optimiert und embedded
- [ ] Static Resource Handling konfiguriert
- [ ] SPA Routing Support implementiert
- [ ] Production Configuration gesetzt
- [ ] Health Checks funktional
- [ ] Startup/Shutdown Scripts erstellt
- [ ] Performance-Optimierungen implementiert
- [ ] Security Best Practices befolgt
- [ ] Dokumentation für Deployment erstellt
- [ ] Build und Deployment getestet

## Abhängigkeiten
- Alle Features 01-14 für vollständige Anwendung

## Nachfolgende Aktivitäten
- Production Deployment auf Target-Environment
- Monitoring und Logging Setup
- CI/CD Pipeline Konfiguration
- Performance Monitoring
- User Acceptance Testing in Production-Umgebung