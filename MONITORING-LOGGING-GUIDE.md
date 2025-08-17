# TodoMVC Monitoring and Logging Guide

## Overview

This comprehensive guide covers monitoring, logging, and observability setup for the TodoMVC application. The solution provides complete visibility into application performance, health, and operational metrics.

### Monitoring Stack Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Prometheus    │    │    Grafana      │
│   (Metrics)     │───►│   (Storage)     │───►│  (Visualization)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Log Files     │    │    Fluentd      │    │   Log Analysis  │
│   (Logs)        │───►│ (Aggregation)   │───►│    (Future)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

- **Spring Boot Actuator**: Application metrics and health endpoints
- **Prometheus**: Metrics collection and storage
- **Grafana**: Metrics visualization and alerting
- **Logback**: Structured logging with multiple appenders
- **Fluentd**: Log aggregation and forwarding (optional)

## Application Metrics

### Spring Boot Actuator Configuration

#### Enabled Endpoints

The application exposes the following actuator endpoints:

| Endpoint | URL | Purpose | Security |
|----------|-----|---------|----------|
| **Health** | `/actuator/health` | Application health status | Public |
| **Metrics** | `/actuator/metrics` | Application metrics | Secured |
| **Info** | `/actuator/info` | Application information | Public |
| **Prometheus** | `/actuator/prometheus` | Prometheus format metrics | Secured |

#### Health Indicators

```yaml
# Custom health indicators implemented
Health Checks:
  - Application Status: Overall application health
  - Disk Space: Available disk space monitoring
  - Todo Storage: In-memory storage health
  - Custom Indicators: Business logic health checks
```

#### Example Health Response

```json
{
  "status": "UP",
  "components": {
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 499963174912,
        "free": 100331544576,
        "threshold": 10485760,
        "path": "/app"
      }
    },
    "todoStorage": {
      "status": "UP",
      "details": {
        "totalTodos": 15,
        "activeTodos": 8,
        "completedTodos": 7,
        "storageType": "in-memory"
      }
    }
  }
}
```

### Custom Metrics

#### Business Metrics

The application tracks custom business metrics:

```java
// Todo operation metrics
todo.creation.time        // Time to create a todo
todo.creation.count       // Number of todos created
todo.completion.rate      // Rate of todo completions
todo.deletion.count       // Number of todos deleted

// Performance metrics
http.request.duration     // HTTP request duration
http.request.count        // HTTP request count
api.response.time         // API response times
concurrent.requests       // Concurrent request count

// System metrics
jvm.memory.used          // JVM memory usage
jvm.gc.time              // Garbage collection time
system.cpu.usage         // CPU usage
system.load.average      // System load average
```

#### Metric Implementation Example

```java
@Component
public class TodoMetrics {
    
    private final MeterRegistry meterRegistry;
    private final Timer todoCreationTimer;
    private final Counter todoCreationCounter;
    private final Gauge activeTodosGauge;
    
    public TodoMetrics(MeterRegistry meterRegistry, TodoStorageService storageService) {
        this.meterRegistry = meterRegistry;
        
        this.todoCreationTimer = Timer.builder("todo.creation.time")
            .description("Time taken to create a todo")
            .tag("operation", "create")
            .register(meterRegistry);
            
        this.todoCreationCounter = Counter.builder("todo.creation.count")
            .description("Number of todos created")
            .register(meterRegistry);
            
        this.activeTodosGauge = Gauge.builder("todo.active.count")
            .description("Number of active todos")
            .register(meterRegistry, storageService, this::getActiveTodoCount);
    }
    
    public void recordTodoCreation(Duration duration) {
        todoCreationTimer.record(duration);
        todoCreationCounter.increment();
    }
    
    private double getActiveTodoCount(TodoStorageService service) {
        return service.getAllTodos().stream()
            .filter(todo -> !todo.isCompleted())
            .count();
    }
}
```

## Prometheus Configuration

### Prometheus Setup

#### Configuration File (`docker/prometheus/prometheus.yml`)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.yml"

scrape_configs:
  # TodoMVC Application
  - job_name: 'todoapp'
    static_configs:
      - targets: ['todoapp:8080']
    metrics_path: '/actuator/prometheus'
    scrape_interval: 30s
    scrape_timeout: 10s
    
  # System metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 30s
    
  # Container metrics
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
    scrape_interval: 30s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

#### Alert Rules (`docker/prometheus/alerts.yml`)

```yaml
groups:
  - name: todoapp.rules
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_server_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} for the last 5 minutes"
      
      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_server_requests_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"
      
      # Application down
      - alert: ApplicationDown
        expr: up{job="todoapp"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "TodoMVC application is down"
          description: "Application has been down for more than 1 minute"
      
      # High memory usage
      - alert: HighMemoryUsage
        expr: jvm_memory_used_bytes / jvm_memory_max_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High JVM memory usage"
          description: "JVM memory usage is {{ $value | humanizePercentage }}"
      
      # Disk space low
      - alert: DiskSpaceLow
        expr: disk_free_bytes / disk_total_bytes < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space"
          description: "Disk space is {{ $value | humanizePercentage }} full"
```

### Prometheus Queries

#### Common Queries for TodoMVC

```promql
# Request rate
rate(http_server_requests_total[5m])

# Error rate
rate(http_server_requests_total{status=~"5.."}[5m]) / rate(http_server_requests_total[5m])

# Response time percentiles
histogram_quantile(0.95, rate(http_server_requests_duration_seconds_bucket[5m]))
histogram_quantile(0.99, rate(http_server_requests_duration_seconds_bucket[5m]))

# Todo operations
rate(todo_creation_count_total[5m])
rate(todo_completion_count_total[5m])

# Active todos
todo_active_count

# JVM metrics
jvm_memory_used_bytes{area="heap"}
rate(jvm_gc_collection_seconds_sum[5m])

# System metrics
system_cpu_usage
system_load_average_1m
```

## Grafana Dashboards

### Dashboard Configuration

#### TodoMVC Main Dashboard

Create comprehensive dashboard showing:

1. **Application Overview**
   - Request rate
   - Error rate
   - Response time
   - Active users

2. **Business Metrics**
   - Total todos
   - Active todos
   - Completed todos
   - Todo creation rate

3. **Performance Metrics**
   - Memory usage
   - CPU usage
   - GC metrics
   - Thread pool usage

4. **Infrastructure Metrics**
   - Disk usage
   - Network I/O
   - Container metrics

#### Dashboard JSON Configuration

```json
{
  "dashboard": {
    "id": null,
    "title": "TodoMVC Application Dashboard",
    "description": "Comprehensive monitoring for TodoMVC application",
    "tags": ["todoapp", "spring-boot", "angular"],
    "timezone": "UTC",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_server_requests_total{job=\"todoapp\"}[5m])",
            "legendFormat": "{{method}} {{uri}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec",
            "min": 0
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(http_server_requests_duration_seconds_bucket{job=\"todoapp\"}[5m]))",
            "legendFormat": "50th percentile"
          },
          {
            "expr": "histogram_quantile(0.95, rate(http_server_requests_duration_seconds_bucket{job=\"todoapp\"}[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.99, rate(http_server_requests_duration_seconds_bucket{job=\"todoapp\"}[5m]))",
            "legendFormat": "99th percentile"
          }
        ],
        "yAxes": [
          {
            "label": "Duration (seconds)",
            "min": 0
          }
        ]
      },
      {
        "id": 3,
        "title": "Active Todos",
        "type": "singlestat",
        "targets": [
          {
            "expr": "todo_active_count{job=\"todoapp\"}",
            "legendFormat": "Active Todos"
          }
        ]
      },
      {
        "id": 4,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "jvm_memory_used_bytes{job=\"todoapp\",area=\"heap\"}",
            "legendFormat": "Heap Used"
          },
          {
            "expr": "jvm_memory_max_bytes{job=\"todoapp\",area=\"heap\"}",
            "legendFormat": "Heap Max"
          }
        ],
        "yAxes": [
          {
            "label": "Bytes",
            "min": 0
          }
        ]
      }
    ]
  }
}
```

### Alert Manager Configuration

#### Alert Manager Setup (`docker/alertmanager/alertmanager.yml`)

```yaml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@yourdomain.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://webhook:5001/webhook'
  
  - name: 'email-alerts'
    email_configs:
      - to: 'ops-team@yourdomain.com'
        subject: 'TodoMVC Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}

  - name: 'slack-alerts'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        title: 'TodoMVC Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

## Logging Configuration

### Structured Logging

#### Log Levels and Categories

```yaml
Log Levels:
  ERROR:   Critical errors requiring immediate attention
  WARN:    Warning conditions that should be reviewed
  INFO:    General application flow information
  DEBUG:   Detailed information for debugging (dev only)
  TRACE:   Very detailed information (dev only)

Log Categories:
  APPLICATION: Business logic and application flow
  SECURITY:    Security-related events and violations
  PERFORMANCE: Performance metrics and slow operations
  AUDIT:       User actions and data changes
  SYSTEM:      Infrastructure and system events
```

#### Log Format Standards

**JSON Format (Production)**:
```json
{
  "timestamp": "2025-08-17T21:00:00.000Z",
  "level": "INFO",
  "thread": "http-nio-8080-exec-1",
  "logger": "com.example.todobackend.service.TodoService",
  "message": "Todo created successfully",
  "correlation_id": "abc123-def456-ghi789",
  "request_id": "req-001",
  "user_id": "anonymous",
  "todo_id": 42,
  "operation": "create_todo",
  "duration_ms": 15
}
```

**Text Format (Development)**:
```
2025-08-17 21:00:00.000 [http-nio-8080-exec-1] INFO  [TodoService] - Todo created successfully [correlation_id=abc123-def456-ghi789]
```

### Log Aggregation

#### Fluentd Configuration

**Fluentd Config** (`docker/fluentd/fluent.conf`):
```xml
<source>
  @type tail
  path /fluentd/logs/application.log
  pos_file /var/log/fluentd/application.log.pos
  tag todoapp.application
  format json
  time_format %Y-%m-%dT%H:%M:%S.%L%z
</source>

<source>
  @type tail
  path /fluentd/logs/security.log
  pos_file /var/log/fluentd/security.log.pos
  tag todoapp.security
  format json
</source>

<source>
  @type tail
  path /fluentd/logs/performance.log
  pos_file /var/log/fluentd/performance.log.pos
  tag todoapp.performance
  format json
</source>

<filter todoapp.**>
  @type record_transformer
  <record>
    hostname ${hostname}
    environment ${ENV["ENVIRONMENT"] || "production"}
    application "todoapp"
  </record>
</filter>

# Output to multiple destinations
<match todoapp.**>
  @type copy
  
  # Console output for debugging
  <store>
    @type stdout
    format json
  </store>
  
  # File output for local storage
  <store>
    @type file
    path /var/log/fluentd/aggregated
    append true
    time_slice_format %Y%m%d%H
    format json
  </store>
  
  # Future: Send to external log management system
  # <store>
  #   @type elasticsearch
  #   host elasticsearch
  #   port 9200
  #   index_name todoapp-logs
  # </store>
</match>
```

### Log Analysis and Monitoring

#### Log-based Alerts

Create alerts based on log patterns:

```yaml
Log Alerts:
  - Error Rate: Monitor ERROR level logs frequency
  - Security Events: Alert on suspicious security events
  - Performance Issues: Alert on slow operations
  - Application Errors: Monitor specific error patterns
```

#### Example Log Analysis Queries

**Fluentd/Elasticsearch Queries**:
```json
# High error rate
{
  "query": {
    "bool": {
      "filter": [
        {"term": {"level": "ERROR"}},
        {"range": {"timestamp": {"gte": "now-5m"}}}
      ]
    }
  },
  "aggs": {
    "error_count": {
      "date_histogram": {
        "field": "timestamp",
        "interval": "1m"
      }
    }
  }
}

# Security events
{
  "query": {
    "bool": {
      "filter": [
        {"term": {"logger": "SECURITY"}},
        {"range": {"timestamp": {"gte": "now-1h"}}}
      ]
    }
  }
}

# Slow operations
{
  "query": {
    "bool": {
      "filter": [
        {"range": {"duration_ms": {"gte": 1000}}},
        {"range": {"timestamp": {"gte": "now-1h"}}}
      ]
    }
  }
}
```

## Performance Monitoring

### Application Performance Monitoring (APM)

#### Key Performance Indicators (KPIs)

```yaml
Response Time Metrics:
  - Average Response Time: < 50ms
  - 95th Percentile: < 200ms
  - 99th Percentile: < 500ms

Throughput Metrics:
  - Requests per Second: Monitor and trend
  - Concurrent Users: Track active sessions
  - API Call Distribution: Monitor endpoint usage

Error Metrics:
  - Error Rate: < 1%
  - 4xx Errors: Client errors
  - 5xx Errors: Server errors

Resource Metrics:
  - CPU Usage: < 80%
  - Memory Usage: < 80%
  - GC Time: < 100ms per collection
  - Thread Pool: Monitor thread utilization
```

#### Performance Benchmarks

```yaml
Target Performance:
  Single Request: < 5ms average
  Bulk Operations: < 10ms for 100 items
  Concurrent Load: 100 req/sec sustained
  Memory Usage: < 1GB heap
  Startup Time: < 30 seconds

Load Testing Targets:
  Normal Load: 50 concurrent users
  Peak Load: 200 concurrent users
  Stress Test: 500 concurrent users
  Endurance: 24-hour sustained load
```

### Monitoring Setup Commands

#### Docker Compose Deployment

```bash
# Start monitoring stack
docker-compose up -d todoapp prometheus grafana

# Check service health
docker-compose ps

# View logs
docker-compose logs -f todoapp
docker-compose logs -f prometheus
docker-compose logs -f grafana

# Scale application
docker-compose up -d --scale todoapp=3
```

#### Manual Prometheus Setup

```bash
# Download and configure Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*

# Create configuration
cat > prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'todoapp'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/actuator/prometheus'
EOF

# Start Prometheus
./prometheus --config.file=prometheus.yml

# Access Prometheus UI
open http://localhost:9090
```

#### Manual Grafana Setup

```bash
# Download and install Grafana
wget https://dl.grafana.com/oss/release/grafana-9.3.0.linux-amd64.tar.gz
tar -zxvf grafana-9.3.0.linux-amd64.tar.gz
cd grafana-9.3.0

# Start Grafana
./bin/grafana-server

# Access Grafana UI (admin/admin)
open http://localhost:3000

# Add Prometheus data source
curl -X POST \
  http://admin:admin@localhost:3000/api/datasources \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Prometheus",
    "type": "prometheus",
    "url": "http://localhost:9090",
    "access": "proxy"
  }'
```

## Troubleshooting

### Common Monitoring Issues

#### Metrics Not Appearing

**Problem**: Metrics not showing in Prometheus
**Solutions**:
```bash
# Check application metrics endpoint
curl http://localhost:8080/actuator/prometheus

# Verify Prometheus can reach application
curl http://localhost:9090/api/v1/targets

# Check Prometheus configuration
docker exec prometheus-container cat /etc/prometheus/prometheus.yml

# Restart Prometheus with new config
docker-compose restart prometheus
```

#### High Memory Usage

**Problem**: Application using too much memory
**Investigation**:
```bash
# Check JVM metrics
curl http://localhost:8080/actuator/metrics/jvm.memory.used

# Get heap dump for analysis
jcmd <pid> GC.run_finalization
jcmd <pid> VM.gc

# Monitor GC activity
curl http://localhost:8080/actuator/metrics/jvm.gc.collection
```

#### Slow Response Times

**Problem**: API responses are slow
**Investigation**:
```bash
# Check response time metrics
curl http://localhost:8080/actuator/metrics/http.server.requests

# Monitor thread pool
curl http://localhost:8080/actuator/metrics/tomcat.threads.busy

# Check database connections (when applicable)
curl http://localhost:8080/actuator/metrics/hikaricp.connections
```

### Log Analysis Issues

#### Missing Logs

**Problem**: Logs not appearing in aggregation system
**Solutions**:
```bash
# Check log file permissions
ls -la /app/logs/

# Verify log configuration
cat /app/config/logback-spring.xml

# Check Fluentd status
docker logs fluentd-container

# Test log rotation
logrotate -f /etc/logrotate.d/todoapp
```

#### Log Format Issues

**Problem**: Logs not parsing correctly
**Solutions**:
```bash
# Validate JSON format
tail -f /app/logs/application.log | jq '.'

# Check Fluentd parsing
docker exec fluentd-container fluentd --dry-run

# Test log format
echo '{"test": "log"}' >> /app/logs/application.log
```

## Best Practices

### Monitoring Best Practices

1. **Implement Health Checks**: Always provide meaningful health checks
2. **Monitor Business Metrics**: Track what matters to your business
3. **Set Meaningful Alerts**: Avoid alert fatigue with relevant alerts
4. **Use Labels Wisely**: Consistent labeling for better querying
5. **Monitor Dependencies**: Include external service monitoring
6. **Regular Review**: Regularly review and update monitoring setup

### Logging Best Practices

1. **Structured Logging**: Use consistent JSON format
2. **Correlation IDs**: Track requests across services
3. **Appropriate Log Levels**: Use correct log levels consistently
4. **Sensitive Data**: Never log sensitive information
5. **Performance Impact**: Consider logging performance impact
6. **Log Retention**: Implement appropriate retention policies

### Security Considerations

1. **Secure Endpoints**: Protect monitoring endpoints
2. **Access Control**: Implement proper RBAC for dashboards
3. **Data Privacy**: Ensure logs don't contain PII
4. **Network Security**: Secure monitoring network traffic
5. **Regular Updates**: Keep monitoring tools updated

## Conclusion

This monitoring and logging setup provides comprehensive observability for the TodoMVC application. The configuration supports:

✅ **Complete Metrics Coverage**: Application, business, and infrastructure metrics  
✅ **Structured Logging**: JSON-formatted logs with correlation IDs  
✅ **Visual Dashboards**: Grafana dashboards for all metrics  
✅ **Alerting**: Proactive alerting for critical issues  
✅ **Log Aggregation**: Centralized log collection and analysis  
✅ **Performance Monitoring**: Detailed performance tracking  
✅ **Security Monitoring**: Security event tracking and alerting  

The setup is designed to scale with the application and provide the observability needed for production deployment and ongoing operations.

---

**Monitoring Guide Version**: 1.0  
**Last Updated**: August 17, 2025  
**Compatibility**: Docker, Kubernetes, Traditional Deployment  
**Status**: Production Ready