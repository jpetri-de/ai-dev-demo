# TodoMVC Deployment Guide

This guide covers deployment strategies for the TodoMVC full-stack application.

## 🎯 Deployment Options

### 1. Development Deployment (Local)

**Backend (Port 8080):**
```bash
cd todo-backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Frontend (Port 4200):**
```bash
cd todo-frontend
npm install
npm start
```

### 2. Production Deployment (Standalone)

#### Option A: Separate Services

**Backend Production:**
```bash
cd todo-backend
mvn clean package -Pprod
java -jar target/todo-backend-1.0.0.jar
```

**Frontend Production:**
```bash
cd todo-frontend
ng build --configuration production
# Serve dist/ folder with nginx, Apache, or any web server
```

#### Option B: Single JAR (Recommended)

**Combine frontend and backend:**
```bash
# 1. Build Angular for production
cd todo-frontend
ng build --configuration production

# 2. Copy Angular build to Spring Boot static resources
cp -r dist/* ../todo-backend/src/main/resources/static/

# 3. Build Spring Boot with embedded frontend
cd ../todo-backend
mvn clean package -Pprod

# 4. Run single JAR
java -jar target/todo-backend-1.0.0.jar
```

Access the complete application at: http://localhost:8080

### 3. Docker Deployment

#### Backend Dockerfile
```dockerfile
# todo-backend/Dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/todo-backend-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Frontend Dockerfile
```dockerfile
# todo-frontend/Dockerfile
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN ng build --configuration production

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./todo-backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod

  frontend:
    build: ./todo-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

**Run with Docker Compose:**
```bash
docker-compose up --build
```

### 4. Cloud Deployment

#### AWS Deployment

**Option A: Elastic Beanstalk**
```bash
# Package Spring Boot JAR
mvn clean package -Pprod

# Deploy to Elastic Beanstalk
eb init
eb create todo-mvc-app
eb deploy
```

**Option B: ECS/Fargate**
```bash
# Build and push Docker images
docker build -t todo-backend ./todo-backend
docker build -t todo-frontend ./todo-frontend

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker tag todo-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/todo-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/todo-backend:latest
```

#### Heroku Deployment

**Backend (Heroku):**
```bash
cd todo-backend

# Create Heroku app
heroku create todo-mvc-backend

# Set environment variables
heroku config:set SPRING_PROFILES_ACTIVE=prod

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

**Frontend (Netlify/Vercel):**
```bash
cd todo-frontend

# Build for production
ng build --configuration production

# Deploy to Netlify
npx netlify-cli deploy --prod --dir=dist
```

#### Google Cloud Platform

**Cloud Run Deployment:**
```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/todo-backend

# Deploy to Cloud Run
gcloud run deploy todo-backend \
  --image gcr.io/PROJECT_ID/todo-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🔧 Environment Configuration

### Backend Environment Variables

```bash
# Production
export SPRING_PROFILES_ACTIVE=prod
export SERVER_PORT=8080
export CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Optional
export LOGGING_LEVEL_ROOT=WARN
export MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info
```

### Frontend Environment Configuration

**Production environment (src/environments/environment.prod.ts):**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-domain.com/api',
  enableLogging: false
};
```

**Build with environment:**
```bash
ng build --configuration production
```

### Health Checks

**Backend Health Endpoint:**
```bash
curl http://localhost:8080/actuator/health
```

**Response:**
```json
{
  "status": "UP",
  "components": {
    "diskSpace": {"status": "UP"},
    "ping": {"status": "UP"}
  }
}
```

## 🚀 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy TodoMVC

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Test Backend
        run: |
          cd todo-backend
          mvn clean test
          
      - name: Test Frontend
        run: |
          cd todo-frontend
          npm ci
          ng test --watch=false
          
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and Deploy
        run: |
          # Build frontend
          cd todo-frontend
          ng build --configuration production
          
          # Copy to backend static resources
          cp -r dist/* ../todo-backend/src/main/resources/static/
          
          # Build backend with frontend
          cd ../todo-backend
          mvn clean package -Pprod
          
          # Deploy to cloud provider
          # (specific deployment commands here)
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    tools {
        maven 'Maven-3.8'
        nodejs 'Node-18'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Test Backend') {
            steps {
                dir('todo-backend') {
                    sh 'mvn clean test'
                }
            }
        }
        
        stage('Test Frontend') {
            steps {
                dir('todo-frontend') {
                    sh 'npm ci'
                    sh 'ng test --watch=false'
                }
            }
        }
        
        stage('Build & Deploy') {
            steps {
                script {
                    // Build frontend
                    dir('todo-frontend') {
                        sh 'ng build --configuration production'
                    }
                    
                    // Copy to backend
                    sh 'cp -r todo-frontend/dist/* todo-backend/src/main/resources/static/'
                    
                    // Build backend
                    dir('todo-backend') {
                        sh 'mvn clean package -Pprod'
                    }
                    
                    // Deploy (example for AWS)
                    sh 'aws s3 cp todo-backend/target/todo-backend-1.0.0.jar s3://deployment-bucket/'
                }
            }
        }
    }
    
    post {
        always {
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'todo-backend/target/site/jacoco',
                reportFiles: 'index.html',
                reportName: 'Coverage Report'
            ])
        }
    }
}
```

## 🔐 Security Considerations

### Production Security Checklist

**Backend:**
- [ ] Enable HTTPS/SSL
- [ ] Restrict CORS origins to production domains
- [ ] Enable security headers (CSRF, XSS protection)
- [ ] Configure authentication if needed
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Secure actuator endpoints

**Frontend:**
- [ ] Enable Content Security Policy (CSP)
- [ ] Implement proper error boundaries
- [ ] Sanitize all user inputs
- [ ] Enable HTTPS for all API calls
- [ ] Remove development tools from production builds

### Example Production Configuration

**Backend (application-prod.properties):**
```properties
# Security
server.ssl.enabled=true
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=${SSL_KEYSTORE_PASSWORD}

# CORS
cors.allowed-origins=${CORS_ALLOWED_ORIGINS:https://yourdomain.com}

# Actuator Security
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=never

# Logging
logging.level.root=WARN
logging.level.com.example.todobackend=INFO
```

**Frontend nginx.conf:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Serve Angular app
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API calls
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Monitoring & Observability

### Application Metrics

**Spring Boot Actuator Endpoints:**
```bash
# Health check
curl https://yourdomain.com/actuator/health

# Application info
curl https://yourdomain.com/actuator/info

# Metrics (if enabled)
curl https://yourdomain.com/actuator/metrics
```

### Log Aggregation

**Structured Logging Configuration:**
```properties
# logback-spring.xml
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} - %msg%n
logging.pattern.file=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
```

**Log Shipping to ELK Stack:**
```yaml
# docker-compose.yml (add to existing)
services:
  elasticsearch:
    image: elasticsearch:7.14.0
    
  logstash:
    image: logstash:7.14.0
    
  kibana:
    image: kibana:7.14.0
    ports:
      - "5601:5601"
```

## 🚨 Troubleshooting

### Common Issues

**Backend fails to start:**
```bash
# Check Java version
java --version

# Check port availability
netstat -an | grep 8080

# Check logs
tail -f logs/application.log
```

**Frontend build fails:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Angular CLI version
ng version
```

**CORS issues in production:**
```bash
# Check CORS configuration
curl -I -X OPTIONS https://yourdomain.com/api/todos \
  -H "Origin: https://frontend-domain.com"
  
# Should return Access-Control-Allow-Origin header
```

### Performance Optimization

**Backend:**
- Enable JVM performance tuning
- Configure connection pooling
- Implement caching strategies
- Use database connection pooling

**Frontend:**
- Enable lazy loading
- Implement service workers
- Optimize bundle sizes
- Use CDN for static assets

**Example JVM Tuning:**
```bash
java -Xms512m -Xmx1024m \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -jar todo-backend-1.0.0.jar
```

## 🎯 Success Metrics

### Deployment Verification

**Health Check Checklist:**
- [ ] Backend health endpoint returns 200
- [ ] Frontend loads without errors
- [ ] API endpoints respond correctly
- [ ] CORS headers present
- [ ] All TodoMVC features functional
- [ ] Performance within acceptable limits
- [ ] Error handling works correctly
- [ ] Logging is functional

**Performance Targets:**
- Backend startup: < 30 seconds
- API response time: < 100ms (95th percentile)
- Frontend load time: < 5 seconds
- Memory usage: < 512MB (backend)

---

**Need help with deployment? Check the logs, verify environment variables, and ensure all prerequisites are met.**