# API Documentation Template

Use this template when documenting API endpoints.

---

## Template

```markdown
# [API Name] API Documentation

## Overview

[One paragraph describing what this API does and who it's for.]

**Base URL:** `https://api.example.com/v1`

## Authentication

[Explain how to authenticate with the API]

### Getting an API Token

[Steps to get a token]

### Using the Token

Include the token in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Endpoints

### [Resource Name]

#### [Action Name]

[One sentence describing what this endpoint does]

**Endpoint:** `[METHOD] /path/to/endpoint`

**Authentication:** [Required | Optional | None]

**Request Headers**
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token |
| Content-Type | Yes | application/json |

**Request Body**
```json
{
  "field_name": "value",
  "another_field": 123
}
```

**Request Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| field_name | string | Yes | What this field is for |
| another_field | number | No | What this field is for |

**Success Response (200 OK)**
```json
{
  "data": {
    "id": "abc123",
    "field_name": "value"
  }
}
```

**Error Response (400 Bad Request)**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "What went wrong",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  }
}
```

**Example Request**
```bash
curl -X POST https://api.example.com/v1/endpoint \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field_name": "value"}'
```

---

## Error Codes

| Code | HTTP Status | Meaning | What to Do |
|------|-------------|---------|------------|
| VALIDATION_ERROR | 400 | Invalid input | Check request format |
| UNAUTHORIZED | 401 | Bad or missing token | Check your token |
| FORBIDDEN | 403 | Not allowed | Check permissions |
| NOT_FOUND | 404 | Resource doesn't exist | Check the ID |
| RATE_LIMITED | 429 | Too many requests | Wait and retry |
| SERVER_ERROR | 500 | Something broke | Try again later |

## Rate Limits

[Explain rate limiting if applicable]

| Endpoint | Limit | Window |
|----------|-------|--------|
| All endpoints | 100 requests | Per minute |
| /upload | 10 requests | Per minute |

## Pagination

[Explain how pagination works if applicable]

**Request**
```
GET /items?page=2&limit=20
```

**Response**
```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

## Versioning

[Explain API versioning]

The API version is in the URL: `/v1/`, `/v2/`, etc.
```

---

## Writing Guidelines

### Do
- Use consistent response formats
- Include real, working examples
- Explain every parameter
- Show both success and error responses
- Keep descriptions short and clear

### Don't
- Use jargon without explanation
- Skip error documentation
- Show incomplete examples
- Assume knowledge of internal systems

---

## Example: Complete API Doc

```markdown
# Users API

## Overview

The Users API lets you create, read, update, and delete user accounts. Use it to manage users in your application.

**Base URL:** `https://api.example.com/v1`

## Authentication

All endpoints require authentication.

### Getting a Token

1. Go to Settings > API Keys in your dashboard
2. Click "Create New Key"
3. Copy the token (you won't see it again)

### Using the Token

```
Authorization: Bearer sk_live_abc123xyz
```

## Endpoints

### Users

#### Create User

Creates a new user account.

**Endpoint:** `POST /users`

**Authentication:** Required

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | Password (min 8 characters) |
| name | string | No | User's display name |

**Success Response (201 Created)**
```json
{
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2026-01-21T10:30:00Z"
  }
}
```

**Error Response (400 Bad Request)**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "email",
        "message": "Email already registered"
      }
    ]
  }
}
```

**Example**
```bash
curl -X POST https://api.example.com/v1/users \
  -H "Authorization: Bearer sk_live_abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

---

#### Get User

Gets a user by ID.

**Endpoint:** `GET /users/{id}`

**Authentication:** Required

**URL Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | The user's ID |

**Success Response (200 OK)**
```json
{
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2026-01-21T10:30:00Z"
  }
}
```

**Error Response (404 Not Found)**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

**Example**
```bash
curl https://api.example.com/v1/users/usr_abc123 \
  -H "Authorization: Bearer sk_live_abc123xyz"
```

---

#### List Users

Gets a list of all users.

**Endpoint:** `GET /users`

**Authentication:** Required

**Query Parameters**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| sort | string | created_at | Sort field |
| order | string | desc | Sort order (asc/desc) |

**Success Response (200 OK)**
```json
{
  "data": [
    {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2026-01-21T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**Example**
```bash
curl "https://api.example.com/v1/users?page=1&limit=20" \
  -H "Authorization: Bearer sk_live_abc123xyz"
```

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| VALIDATION_ERROR | 400 | Check your request data |
| UNAUTHORIZED | 401 | Check your API token |
| FORBIDDEN | 403 | You don't have permission |
| NOT_FOUND | 404 | The item doesn't exist |
| RATE_LIMITED | 429 | Too many requests, wait and retry |

## Rate Limits

- 100 requests per minute per API key
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`: Total allowed
  - `X-RateLimit-Remaining`: Requests left
  - `X-RateLimit-Reset`: When the limit resets (Unix timestamp)
```
