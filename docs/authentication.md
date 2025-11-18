# Authentication & Authorization

## Overview

The API uses JWT (JSON Web Tokens) with role-based access control. There are two roles:
- **`user`**: Regular citizens who can report issues
- **`admin`**: Administrators who can manage issues

## User Authentication (SMS-based)

### 1. Request OTP
```http
POST /api/v1/user/auth/login/request-otp
Content-Type: application/json

{
  "phone": "+1234567890"
}
```

### 2. Verify OTP & Get Token
```http
POST /api/v1/user/auth/login/verify-otp
Content-Type: application/json

{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful. OTP verified.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "number": "+1234567890",
    "role": "user"
  }
}
```

## Admin Authentication

### Login
```http
POST /api/v1/admin/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "admin-uuid",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

## Using the Token

Include the JWT token in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Or without "Bearer" prefix:
```http
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Protected Routes

### User Routes (require `user` role)
- `POST /api/v1/user/issues` - Create issue
- `GET /api/v1/user/issues` - Get user's issues
- `GET /api/v1/user/issues/:id` - Get specific issue

### Admin Routes (require `admin` role)
- `GET /api/v1/admin/issues` - Get all issues
- `GET /api/v1/admin/issues/:id` - Get specific issue
- `PUT /api/v1/admin/issues/:id/status` - Update issue status

## Token Structure

JWT tokens contain:
- `sub`: User/Admin ID
- `role`: Either `"user"` or `"admin"`
- `number` (for users): Phone number
- `email` (for admins): Email address
- `exp`: Expiration time (default: 12 hours)

## Error Responses

### 401 Unauthorized
```json
{
  "message": "No token provided"
}
```

### 401 Invalid Token
```json
{
  "message": "Invalid token"
}
```

### 401 Token Expired
```json
{
  "message": "Token expired"
}
```

### 403 Access Denied
```json
{
  "message": "Access denied. Required role: admin"
}
```

## Middleware

The authentication middleware (`middleware/auth.js`) provides:
- `authenticate`: Verifies JWT token and attaches user info to `req.user`
- `requireRole(...roles)`: Checks if user has one of the required roles
- `requireAdmin`: Convenience middleware for admin-only routes
- `requireUser`: Convenience middleware for user-only routes

## Security Notes

- Tokens expire after 12 hours (configurable via `JWT_EXPIRES_IN`)
- Users can only see and create their own issues
- Admins can see and manage all issues
- Always use HTTPS in production
- Store tokens securely on the client side

