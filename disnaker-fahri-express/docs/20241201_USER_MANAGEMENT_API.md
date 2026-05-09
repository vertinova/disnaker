# User Management API Documentation

## Base URL
```
http://localhost:3001/api/users
```

## Authentication
All endpoints require authentication. Include JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Get User Statistics
Get aggregated statistics about users.

**Endpoint:** `GET /api/users/stats`

**Response:**
```json
{
  "success": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "total": 444,
    "superadmin": 1,
    "dinas": 12,
    "bidang": 28,
    "kecamatan": 40,
    "desa": 363,
    "active": 440,
    "inactive": 4
  }
}
```

---

### 2. Get All Users
Get list of users with filtering and pagination.

**Endpoint:** `GET /api/users`

**Query Parameters:**
- `role` (string, optional): Filter by user role
- `kecamatan_id` (integer, optional): Filter by kecamatan
- `desa_id` (integer, optional): Filter by desa
- `bidang_id` (integer, optional): Filter by bidang
- `search` (string, optional): Search by name, email, or username
- `page` (integer, optional, default: 1): Page number
- `limit` (integer, optional, default: 50): Items per page

**Example Request:**
```
GET /api/users?role=desa&page=1&limit=20
GET /api/users?search=john&kecamatan_id=1
```

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Super Admin",
      "email": "superadmin@dpmd.bogorkab.go.id",
      "username": "superadmin",
      "role": "superadmin",
      "bidang_id": null,
      "bidang": null,
      "kecamatan_id": null,
      "kecamatan": null,
      "desa_id": null,
      "desa": null,
      "avatar": null,
      "is_active": true,
      "created_at": "2025-11-01T00:00:00.000Z",
      "updated_at": "2025-11-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 444,
    "totalPages": 23
  }
}
```

---

### 3. Get User by ID
Get detailed information about a specific user.

**Endpoint:** `GET /api/users/:id`

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 1,
    "name": "Super Admin",
    "email": "superadmin@dpmd.bogorkab.go.id",
    "username": "superadmin",
    "role": "superadmin",
    "bidang_id": null,
    "bidang": null,
    "kecamatan_id": null,
    "kecamatan": null,
    "desa_id": null,
    "desa": null,
    "avatar": null,
    "is_active": true,
    "created_at": "2025-11-01T00:00:00.000Z",
    "updated_at": "2025-11-01T00:00:00.000Z"
  }
}
```

---

### 4. Create User
Create a new user.

**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "password": "SecurePassword123",
  "role": "desa",
  "bidang_id": null,
  "kecamatan_id": 1,
  "desa_id": 5,
  "avatar": null,
  "is_active": true
}
```

**Required Fields:**
- `name` (string)
- `email` (string)
- `username` (string)
- `password` (string)
- `role` (string)

**Optional Fields:**
- `bidang_id` (integer or null)
- `kecamatan_id` (integer or null)
- `desa_id` (integer or null)
- `avatar` (string or null)
- `is_active` (boolean, default: true)

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 445,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "role": "desa",
    "...": "..."
  }
}
```

---

### 5. Update User
Update an existing user.

**Endpoint:** `PUT /api/users/:id`

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "role": "kecamatan",
  "is_active": true
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 445,
    "name": "John Doe Updated",
    "...": "..."
  }
}
```

---

### 6. Toggle User Status
Activate or deactivate a user.

**Endpoint:** `PATCH /api/users/:id/toggle-status`

**Response:**
```json
{
  "success": true,
  "message": "User activated successfully",
  "data": {
    "id": 445,
    "is_active": true
  }
}
```

---

### 7. Delete User
Delete a user.

**Endpoint:** `DELETE /api/users/:id`

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Note:** Cannot delete the last superadmin user.

---

## User Roles

Available user roles (from database enum):
- `superadmin`
- `admin`
- `desa`
- `kecamatan`
- `dinas`
- `kepala_dinas`
- `sarpras`
- `sekretariat`
- `sarana_prasarana`
- `kekayaan_keuangan`
- `pemberdayaan_masyarakat`
- `pemerintahan_desa`

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Email already exists"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch users",
  "error": "Error details"
}
```
