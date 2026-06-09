# API Documentation - Vendora POS Pro

This document tracks all backend Web API endpoints.

---

## Base URL
Local Development: `http://localhost:5149` (mapped in `launchSettings.json`)

---

## Authentication & Context Endpoints

### 1. Register Business Owner
Registers a new owner user and their first business in a single transaction.

*   **Endpoint**: `POST /api/auth/register-owner`
*   **Authentication**: Anonymous
*   **Request Body**:
    ```json
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "owner@example.com",
      "password": "Password123!",
      "businessName": "Doe Enterprises",
      "subdomain": "doe"
    }
    ```
*   **Success Response** (200 OK):
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "userId": "d718b5b7-7ab8-48b0-a590-db0e68d1b117",
      "email": "owner@example.com",
      "role": "Owner",
      "businessId": "c620400b-337c-4861-bb27-7756f7ef2542"
    }
    ```

### 2. Login
Authenticates users and returns a signed JWT.

*   **Endpoint**: `POST /api/auth/login`
*   **Authentication**: Anonymous
*   **Request Body**:
    ```json
    {
      "email": "owner@example.com",
      "password": "Password123!"
    }
    ```
*   **Success Response** (200 OK):
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "userId": "d718b5b7-7ab8-48b0-a590-db0e68d1b117",
      "email": "owner@example.com",
      "role": "Owner",
      "businessId": "c620400b-337c-4861-bb27-7756f7ef2542",
      "branchId": null
    }
    ```

### 3. Get Current User Context
Returns context of the currently logged-in user.

*   **Endpoint**: `GET /api/auth/me`
*   **Authentication**: Bearer JWT
*   **Success Response** (200 OK):
    ```json
    {
      "userId": "d718b5b7-7ab8-48b0-a590-db0e68d1b117",
      "email": "owner@example.com",
      "role": "Owner",
      "businessId": "c620400b-337c-4861-bb27-7756f7ef2542",
      "branchId": null
    }
    ```

### 4. Switch Active Business
Updates the user's active business context in the database and returns a fresh JWT with updated tenant claims.

*   **Endpoint**: `POST /api/auth/switch-business/{businessId}`
*   **Authentication**: Bearer JWT (Owner role only)
*   **Success Response** (200 OK):
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "userId": "d718b5b7-7ab8-48b0-a590-db0e68d1b117",
      "email": "owner@example.com",
      "role": "Owner",
      "businessId": "9b3a7d2a-4b3b-41c2-b4af-c47249ac840e",
      "branchId": null
    }
    ```

### 5. Switch Active Branch
Updates the owner user's active branch context in the database and returns a fresh JWT with updated branch claims.

*   **Endpoint**: `POST /api/auth/switch-branch/{branchId}`
*   **Authentication**: Bearer JWT (Owner role only)
*   **Parameters**:
    *   `branchId` (path parameter, string, required) - Pass a branch Guid or `global` to switch back to consolidated view.
*   **Success Response** (200 OK):
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "userId": "d718b5b7-7ab8-48b0-a590-db0e68d1b117",
      "email": "owner@example.com",
      "role": "Owner",
      "businessId": "c620400b-337c-4861-bb27-7756f7ef2542",
      "branchId": "c8d880c9-9b12-43c7-9cef-12c788e9d005"
    }
    ```

---

## Business Management Endpoints (Owner Role Only)

### 1. Get My Businesses
Retrieves all businesses owned by the authenticated owner user.

*   **Endpoint**: `GET /api/businesses/my-businesses`
*   **Authentication**: Bearer JWT (Owner role only)

### 2. Create Business
Registers an additional business (tenant) owned by the current owner.

*   **Endpoint**: `POST /api/businesses`
*   **Authentication**: Bearer JWT (Owner role only)

---

## Branch Management Endpoints

### 1. Get My Branches
Retrieves all branches belonging to the active business context.

*   **Endpoint**: `GET /api/branches`
*   **Authentication**: Bearer JWT (Owner role only)
*   **Success Response** (200 OK):
    ```json
    [
      {
        "id": "c8d880c9-9b12-43c7-9cef-12c788e9d005",
        "name": "Northside Depot",
        "address": "123 North Ave, City Center",
        "phone": "555-0199",
        "createdAt": "2026-06-08T14:15:00Z"
      }
    ]
    ```

### 2. Get Branch Details
Retrieves details of a specific branch.

*   **Endpoint**: `GET /api/branches/{id}`
*   **Authentication**: Bearer JWT (Owner, Manager, or Cashier assigned to the branch)
*   **Success Response** (200 OK)

### 3. Create Branch
Creates a new branch under the active business.

*   **Endpoint**: `POST /api/branches`
*   **Authentication**: Bearer JWT (Owner role only)
*   **Request Body**:
    ```json
    {
      "name": "Northside Depot",
      "address": "123 North Ave, City Center",
      "phone": "555-0199"
    }
    ```

---

## Staff Management Endpoints (Owner Role Only)

### 1. Get Store Staff
Retrieves all staff members (Managers and Cashiers) working in the active business. If the owner has an active `branch_id` context, only returns staff assigned to that branch.

*   **Endpoint**: `GET /api/staff`
*   **Authentication**: Bearer JWT (Owner role only)
*   **Success Response** (200 OK):
    ```json
    [
      {
        "id": "019ea7a1-9023-748d-9ca3-f9050db997f7",
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane.doe@example.com",
        "role": "Cashier",
        "branchId": "c8d880c9-9b12-43c7-9cef-12c788e9d005",
        "branchName": "Northside Depot"
      }
    ]
    ```

### 2. Create Staff User
Registers a new Manager or Cashier user and assigns them to the specified branch.

*   **Endpoint**: `POST /api/staff`
*   **Authentication**: Bearer JWT (Owner role only)
*   **Request Body**:
    ```json
    {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@example.com",
      "password": "SecurePassword123!",
      "role": "Cashier",
      "branchId": "c8d880c9-9b12-43c7-9cef-12c788e9d005"
    }
    ```
*   **Success Response** (200 OK):
    ```json
    {
      "id": "019ea7a1-9023-748d-9ca3-f9050db997f7",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@example.com",
      "role": "Cashier",
      "branchId": "c8d880c9-9b12-43c7-9cef-12c788e9d005",
      "branchName": "Northside Depot"
    }
    ```
