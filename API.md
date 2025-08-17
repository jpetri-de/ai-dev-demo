# TodoMVC API Documentation

Complete REST API documentation for the TodoMVC Spring Boot backend.

## 🌐 Base URL

- **Development**: `http://localhost:8080`
- **Production**: `https://your-domain.com`

## 📡 API Endpoints

### 1. Get All Todos

**Endpoint:** `GET /api/todos`

**Description:** Retrieve all todos from the system.

**Request:**
```http
GET /api/todos HTTP/1.1
Host: localhost:8080
Accept: application/json
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: http://localhost:4200

[
  {
    "id": 1,
    "title": "Learn Angular",
    "completed": false
  },
  {
    "id": 2,
    "title": "Build TodoMVC",
    "completed": true
  }
]
```

**cURL Example:**
```bash
curl -X GET http://localhost:8080/api/todos \
  -H "Accept: application/json"
```

---

### 2. Create Todo

**Endpoint:** `POST /api/todos`

**Description:** Create a new todo item.

**Request Body:**
```json
{
  "title": "New todo item"
}
```

**Validation Rules:**
- `title`: Required, not blank, max 500 characters

**Request:**
```http
POST /api/todos HTTP/1.1
Host: localhost:8080
Content-Type: application/json
Accept: application/json

{
  "title": "Learn Spring Boot"
}
```

**Success Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/todos/3

{
  "id": 3,
  "title": "Learn Spring Boot",
  "completed": false
}
```

**Validation Error Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "message": "Validation failed",
  "details": "title: Title cannot be blank",
  "status": 400,
  "timestamp": "2025-08-17T18:14:30.245055",
  "correlationId": "32939f99-b517-47a2-b904-3a22571ec57a",
  "path": "/api/todos",
  "validationErrors": [
    {
      "field": "title",
      "rejectedValue": "",
      "message": "Title cannot be blank",
      "code": "NotBlank"
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/todos \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"title":"Learn Spring Boot"}'
```

---

### 3. Update Todo

**Endpoint:** `PUT /api/todos/{id}`

**Description:** Update an existing todo item.

**Path Parameters:**
- `id` (Long): Todo ID

**Request Body:**
```json
{
  "title": "Updated todo title",
  "completed": true
}
```

**Validation Rules:**
- `title`: Optional, max 500 characters if provided
- `completed`: Optional boolean

**Request:**
```http
PUT /api/todos/1 HTTP/1.1
Host: localhost:8080
Content-Type: application/json
Accept: application/json

{
  "title": "Learn Angular Framework",
  "completed": true
}
```

**Success Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 1,
  "title": "Learn Angular Framework",
  "completed": true
}
```

**Not Found Response:**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "message": "Todo not found with id: 999",
  "details": "The requested todo does not exist",
  "status": 404,
  "timestamp": "2025-08-17T18:14:30.255079",
  "correlationId": "a711e93d-4fa8-43ce-b9ee-9f9ad44bbc45",
  "path": "/api/todos/999",
  "validationErrors": null
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:8080/api/todos/1 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"title":"Learn Angular Framework","completed":true}'
```

---

### 4. Delete Todo

**Endpoint:** `DELETE /api/todos/{id}`

**Description:** Delete a specific todo item.

**Path Parameters:**
- `id` (Long): Todo ID

**Request:**
```http
DELETE /api/todos/1 HTTP/1.1
Host: localhost:8080
```

**Success Response:**
```http
HTTP/1.1 204 No Content
```

**Not Found Response:**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "message": "Todo not found with id: 999",
  "details": "The requested todo does not exist",
  "status": 404,
  "timestamp": "2025-08-17T18:14:30.264979",
  "correlationId": "d4dca696-9779-4e42-a2bb-64294fabbb74",
  "path": "/api/todos/999",
  "validationErrors": null
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:8080/api/todos/1
```

---

### 5. Toggle Todo Completion

**Endpoint:** `PUT /api/todos/{id}/toggle`

**Description:** Toggle the completion status of a todo item.

**Path Parameters:**
- `id` (Long): Todo ID

**Request:**
```http
PUT /api/todos/1/toggle HTTP/1.1
Host: localhost:8080
Accept: application/json
```

**Success Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 1,
  "title": "Learn Angular",
  "completed": true
}
```

**Not Found Response:**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "message": "Todo not found with id: 999",
  "details": "The requested todo does not exist",
  "status": 404,
  "timestamp": "2025-08-17T18:14:30.264979",
  "correlationId": "d4dca696-9779-4e42-a2bb-64294fabbb74",
  "path": "/api/todos/999/toggle",
  "validationErrors": null
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:8080/api/todos/1/toggle \
  -H "Accept: application/json"
```

---

### 6. Clear Completed Todos

**Endpoint:** `DELETE /api/todos/completed`

**Description:** Delete all completed todo items.

**Request:**
```http
DELETE /api/todos/completed HTTP/1.1
Host: localhost:8080
```

**Success Response:**
```http
HTTP/1.1 204 No Content
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:8080/api/todos/completed
```

---

### 7. Get Active Todo Count

**Endpoint:** `GET /api/todos/count/active`

**Description:** Get the count of active (incomplete) todos.

**Request:**
```http
GET /api/todos/count/active HTTP/1.1
Host: localhost:8080
Accept: application/json
```

**Success Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

5
```

**cURL Example:**
```bash
curl -X GET http://localhost:8080/api/todos/count/active \
  -H "Accept: application/json"
```

---

### 8. Get Total Todo Count

**Endpoint:** `GET /api/todos/count/total`

**Description:** Get the total count of all todos.

**Request:**
```http
GET /api/todos/count/total HTTP/1.1
Host: localhost:8080
Accept: application/json
```

**Success Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

10
```

**cURL Example:**
```bash
curl -X GET http://localhost:8080/api/todos/count/total \
  -H "Accept: application/json"
```

---

## 📊 Data Models

### Todo Response Model

```json
{
  "id": 1,
  "title": "Learn Angular",
  "completed": false
}
```

**Properties:**
- `id` (Long): Unique identifier, auto-generated
- `title` (String): Todo title, max 500 characters
- `completed` (Boolean): Completion status

### Create Todo Request Model

```json
{
  "title": "New todo item"
}
```

**Properties:**
- `title` (String): **Required**, not blank, max 500 characters

**Validation:**
- Must not be null or empty
- Whitespace-only titles are rejected
- Maximum length: 500 characters
- Input is automatically trimmed

### Update Todo Request Model

```json
{
  "title": "Updated title",
  "completed": true
}
```

**Properties:**
- `title` (String): **Optional**, max 500 characters if provided
- `completed` (Boolean): **Optional**, updates completion status

**Validation:**
- Both fields are optional
- If title provided, max 500 characters
- Input is automatically trimmed

### Error Response Model

```json
{
  "message": "Error summary",
  "details": "Detailed error description",
  "status": 400,
  "timestamp": "2025-08-17T18:14:30.245055",
  "correlationId": "32939f99-b517-47a2-b904-3a22571ec57a",
  "path": "/api/todos",
  "validationErrors": [
    {
      "field": "title",
      "rejectedValue": "",
      "message": "Title cannot be blank",
      "code": "NotBlank"
    }
  ]
}
```

**Properties:**
- `message` (String): High-level error message
- `details` (String): Detailed error description
- `status` (Integer): HTTP status code
- `timestamp` (String): ISO 8601 timestamp
- `correlationId` (String): Unique request identifier
- `path` (String): Request path that caused the error
- `validationErrors` (Array): Field validation errors (optional)

**Validation Error Properties:**
- `field` (String): Field name that failed validation
- `rejectedValue` (Any): Value that was rejected
- `message` (String): Human-readable error message
- `code` (String): Validation constraint code

---

## 🔧 Technical Details

### HTTP Status Codes

| Status Code | Description | When Used |
|-------------|-------------|-----------|
| `200 OK` | Success | GET, PUT operations |
| `201 Created` | Resource created | POST operations |
| `204 No Content` | Success, no content | DELETE operations |
| `400 Bad Request` | Validation error | Invalid input data |
| `404 Not Found` | Resource not found | Non-existent todo ID |
| `500 Internal Server Error` | Server error | Unexpected server issues |

### Content Types

**Request Content-Type:**
- `application/json` (for POST/PUT requests)

**Response Content-Type:**
- `application/json` (for all responses with body)

### CORS Headers

The API includes CORS headers for frontend integration:

```http
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

**Supported Origins (Development):**
- `http://localhost:4200` (Angular dev server)
- `http://localhost:4201` (Alternative dev port)
- `http://localhost:4202` (Alternative dev port)

### Request/Response Headers

**Common Request Headers:**
```http
Content-Type: application/json
Accept: application/json
Origin: http://localhost:4200
```

**Common Response Headers:**
```http
Content-Type: application/json
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Credentials: true
X-Request-ID: auto-generated-uuid
X-Correlation-ID: auto-generated-uuid
```

### Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider implementing rate limiting based on:
- IP address
- User authentication
- API key usage

### Caching

**Cache Headers:**
- No explicit caching headers are set
- Consider adding `Cache-Control` headers for production
- ETags could be implemented for optimistic caching

**Recommended Cache Strategy:**
```http
# For GET /api/todos
Cache-Control: no-cache, must-revalidate

# For todo counts
Cache-Control: max-age=60, public
```

---

## 🧪 Testing Examples

### Postman Collection

```json
{
  "info": {
    "name": "TodoMVC API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Todos",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/todos",
          "host": ["{{baseUrl}}"],
          "path": ["api", "todos"]
        }
      }
    },
    {
      "name": "Create Todo",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"Learn Postman\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/todos",
          "host": ["{{baseUrl}}"],
          "path": ["api", "todos"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8080"
    }
  ]
}
```

### Integration Test Example

```bash
#!/bin/bash
# integration-test.sh

BASE_URL="http://localhost:8080"

echo "=== TodoMVC API Integration Test ==="

# Test 1: Get all todos (should be empty initially)
echo "1. Getting all todos..."
RESPONSE=$(curl -s -w "%{http_code}" -X GET $BASE_URL/api/todos)
HTTP_CODE="${RESPONSE: -3}"
BODY="${RESPONSE%???}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ GET /api/todos - SUCCESS"
else
    echo "❌ GET /api/todos - FAILED (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 2: Create a todo
echo "2. Creating a todo..."
RESPONSE=$(curl -s -w "%{http_code}" -X POST $BASE_URL/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Todo"}')
HTTP_CODE="${RESPONSE: -3}"
BODY="${RESPONSE%???}"

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ POST /api/todos - SUCCESS"
    TODO_ID=$(echo $BODY | jq -r '.id')
else
    echo "❌ POST /api/todos - FAILED (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 3: Toggle todo
echo "3. Toggling todo completion..."
RESPONSE=$(curl -s -w "%{http_code}" -X PUT $BASE_URL/api/todos/$TODO_ID/toggle)
HTTP_CODE="${RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ PUT /api/todos/$TODO_ID/toggle - SUCCESS"
else
    echo "❌ PUT /api/todos/$TODO_ID/toggle - FAILED (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 4: Get counts
echo "4. Getting todo counts..."
ACTIVE_COUNT=$(curl -s $BASE_URL/api/todos/count/active)
TOTAL_COUNT=$(curl -s $BASE_URL/api/todos/count/total)

echo "   Active: $ACTIVE_COUNT, Total: $TOTAL_COUNT"
echo "✅ Count endpoints - SUCCESS"

echo "🎉 All tests passed!"
```

### Load Testing with Apache Bench

```bash
# Test GET endpoint
ab -n 1000 -c 10 http://localhost:8080/api/todos

# Test POST endpoint
ab -n 100 -c 5 -p create-todo.json -T application/json http://localhost:8080/api/todos
```

**create-todo.json:**
```json
{"title":"Load test todo"}
```

---

## 🔍 Error Handling

### Common Error Scenarios

**1. Validation Errors (400 Bad Request)**
```bash
# Empty title
curl -X POST http://localhost:8080/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":""}'

# Title too long (>500 chars)
curl -X POST http://localhost:8080/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"'$(python -c "print('a' * 501)")'"}'
```

**2. Not Found Errors (404 Not Found)**
```bash
# Non-existent todo
curl -X GET http://localhost:8080/api/todos/999
curl -X PUT http://localhost:8080/api/todos/999/toggle
curl -X DELETE http://localhost:8080/api/todos/999
```

**3. Malformed JSON (400 Bad Request)**
```bash
# Invalid JSON
curl -X POST http://localhost:8080/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"'  # Missing closing brace
```

### Error Response Examples

**Validation Error:**
```json
{
  "message": "Validation failed",
  "details": "title: Title cannot be blank",
  "status": 400,
  "timestamp": "2025-08-17T18:14:30.245055",
  "correlationId": "32939f99-b517-47a2-b904-3a22571ec57a",
  "path": "/api/todos",
  "validationErrors": [
    {
      "field": "title",
      "rejectedValue": "",
      "message": "Title cannot be blank",
      "code": "NotBlank"
    }
  ]
}
```

**Not Found Error:**
```json
{
  "message": "Todo not found with id: 999",
  "details": "The requested todo does not exist",
  "status": 404,
  "timestamp": "2025-08-17T18:14:30.255079",
  "correlationId": "a711e93d-4fa8-43ce-b9ee-9f9ad44bbc45",
  "path": "/api/todos/999",
  "validationErrors": null
}
```

---

**For more information, see the [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md) files.**