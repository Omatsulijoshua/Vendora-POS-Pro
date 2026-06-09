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

---

## Business Settings Endpoints (Owner Role Only)

### 1. Toggle Shared Stock Mode
Toggles the shared stock mode setting for the active business, performing stock aggregation (when moving to shared mode) or stock splitting (when moving to branch mode).

*   **Endpoint**: `PUT /api/businesses/toggle-shared-stock`
*   **Authentication**: Bearer JWT (Owner role only)
*   **Success Response** (200 OK):
    ```json
    {
      "id": "c620400b-337c-4861-bb27-7756f7ef2542",
      "sharedStockMode": true
    }
    ```

---

## Category Management Endpoints

### 1. Get Categories
Retrieves all active categories belonging to the active business context.

*   **Endpoint**: `GET /api/categories`
*   **Authentication**: Bearer JWT (All authenticated users)
*   **Success Response** (200 OK):
    ```json
    [
      {
        "id": "96cb65b5-8253-4db3-b98e-9aca8a10d3a1",
        "name": "Drinks",
        "description": "Cold sodas, drinks, and juices",
        "isActive": true,
        "createdAt": "2026-06-08T18:49:50Z"
      }
    ]
    ```

### 2. Create Category
Creates a new category for grouping products.

*   **Endpoint**: `POST /api/categories`
*   **Authentication**: Bearer JWT (Owner role only)
*   **Request Body**:
    ```json
    {
      "name": "Beverages",
      "description": "Cold drinks, sodas, and juices"
    }
    ```

### 3. Update Category
Updates an existing category's details.

*   **Endpoint**: `PUT /api/categories/{id}`
*   **Authentication**: Bearer JWT (Owner role only)

### 4. Delete Category
Soft deletes a category by setting its `IsActive` state to false.

*   **Endpoint**: `DELETE /api/categories/{id}`
*   **Authentication**: Bearer JWT (Owner role only)

---

## Product & Stock Management Endpoints

### 1. Get Products
Retrieves active products, dynamically resolving stock levels based on caller context (Global consolidated view for Owner, or branch-scoped view for branch staff/swapped context).

*   **Endpoint**: `GET /api/products`
*   **Authentication**: Bearer JWT (All authenticated users)
*   **Query Parameters**:
    *   `search` (string, optional) - Text search matching name, SKU, or Barcode
    *   `categoryId` (uuid, optional) - Filter by category
    *   `lowStockOnly` (boolean, optional) - Filter to products below minimum stock safety threshold
*   **Success Response** (200 OK - Global View):
    ```json
    [
      {
        "id": "b4de8b0b-989b-4bed-9918-063508dcc488",
        "name": "Coca Cola",
        "sku": "COKE-01",
        "barcode": "123456789012",
        "description": "Refreshing Coca Cola beverage",
        "price": 1.5,
        "costPrice": 0.8,
        "isActive": true,
        "categoryId": "96cb65b5-8253-4db3-b98e-9aca8a10d3a1",
        "categoryName": "Drinks",
        "totalStock": 70,
        "underStockAlert": false,
        "createdAt": "2026-06-08T18:49:52Z",
        "branchStocks": [
          {
            "branchId": "bb49ff14-75e1-45a2-b7f9-762d2cfac664",
            "branchName": "Branch Alpha",
            "quantity": 50,
            "minStockLevel": 10,
            "underStockAlert": false
          },
          {
            "branchId": "f5cc395b-601d-4d6e-bd10-31980bb59a91",
            "branchName": "Branch Beta",
            "quantity": 20,
            "minStockLevel": 5,
            "underStockAlert": false
          }
        ]
      }
    ]
    ```

### 2. Get Product Details
Retrieves details of a single product.

*   **Endpoint**: `GET /api/products/{id}`
*   **Authentication**: Bearer JWT (All authenticated users)

### 3. Get Product by Barcode
Quick barcode scan lookup endpoint for cashier operations.

*   **Endpoint**: `GET /api/products/barcode/{barcode}`
*   **Authentication**: Bearer JWT (All authenticated users)

### 4. Create Product
Creates a new product catalog entry and seeds its initial stock levels.

*   **Endpoint**: `POST /api/products`
*   **Authentication**: Bearer JWT (Owner role only)
*   **Request Body**:
    ```json
    {
      "name": "Coca Cola",
      "sku": "COKE-01",
      "barcode": "123456789012",
      "description": "Refreshing Coca Cola beverage",
      "price": 1.50,
      "costPrice": 0.80,
      "categoryId": "96cb65b5-8253-4db3-b98e-9aca8a10d3a1",
      "initialStocks": [
        { "branchId": "bb49ff14-75e1-45a2-b7f9-762d2cfac664", "quantity": 50, "minStockLevel": 10 },
        { "branchId": "f5cc395b-601d-4d6e-bd10-31980bb59a91", "quantity": 20, "minStockLevel": 5 }
      ]
    }
    ```

### 5. Update Product
Updates product properties (excluding stock counts, which must go through the adjustment endpoint).

*   **Endpoint**: `PUT /api/products/{id}`
*   **Authentication**: Bearer JWT (Owner role only)

### 6. Adjust Stock Level
Performs a stock adjustment transaction, modifying stock quantity/thresholds and logging an audit trail record.

*   **Endpoint**: `PUT /api/products/{id}/adjust-stock`
*   **Authentication**: Bearer JWT (Owner or branch-assigned Manager)
*   **Request Body**:
    ```json
    {
      "branchId": "bb49ff14-75e1-45a2-b7f9-762d2cfac664",
      "quantity": 15,
      "minStockLevel": 5,
      "reason": "Restocked from main distributor"
    }
    ```

### 7. Get Stock Adjustment Logs
Retrieves the audit trail logs for a product, restricted to the caller's active tenant and branch context.

*   **Endpoint**: `GET /api/products/{id}/adjustment-logs`
*   **Authentication**: Bearer JWT (All authenticated users)
*   **Success Response** (200 OK):
    ```json
    [
      {
        "id": "c1a6034e-0347-497f-bc3a-969408b0c8d1",
        "productId": "6f5b5480-b8f7-4f3e-9d2f-910049272ba6",
        "productName": "Pepsi Cola",
        "branchId": "1fab3214-31f8-491c-b4c6-35c0e96825c5",
        "branchName": "Branch Alpha",
        "previousQuantity": 3,
        "newQuantity": 15,
        "adjustedByUserId": "019ea7a1-9023-748d-9ca3-f9050db997f7",
        "adjustedByUserName": "Mark Manager",
        "reason": "Restocked from main distributor",
        "createdAt": "2026-06-08T18:56:50Z"
      }
    ]
    ```

### 8. Delete Product
Soft deletes a product from the catalog.

*   **Endpoint**: `DELETE /api/products/{id}`
*   **Authentication**: Bearer JWT (Owner role only)

---

## Stock Transfer Management Endpoints

### 1. Get Stock Transfers
Retrieves all stock transfers belonging to the active business context. If the caller has a branch context (e.g. Manager), only returns transfers where their branch is either the source or target.

*   **Endpoint**: `GET /api/stocktransfers`
*   **Authentication**: Bearer JWT (Owner or Manager role only)
*   **Success Response** (200 OK):
    ```json
    [
      {
        "id": "bb49ff14-75e1-45a2-b7f9-762d2cfac664",
        "productId": "6f5b5480-b8f7-4f3e-9d2f-910049272ba6",
        "productName": "Coca Cola",
        "sourceBranchId": "d850d7f0-588f-4a79-892a-cc6b0bc00461",
        "sourceBranchName": "Branch Alpha",
        "targetBranchId": "1c449042-fd31-4da6-b315-2c5a98316aab",
        "targetBranchName": "Branch Beta",
        "quantity": 15,
        "status": "Pending",
        "initiatedByUserId": "019ea7a1-9023-748d-9ca3-f9050db997f7",
        "initiatedByUserName": "Amy Manager",
        "resolvedByUserId": null,
        "resolvedByUserName": null,
        "notes": "Moving Coke to Beta",
        "rejectionReason": null,
        "createdAt": "2026-06-09T07:20:00Z",
        "updatedAt": null
      }
    ]
    ```

### 2. Get Stock Transfer Detail
Retrieves the details of a specific stock transfer, restricted to the caller's active business and branch context.

*   **Endpoint**: `GET /api/stocktransfers/{id}`
*   **Authentication**: Bearer JWT (Owner or Manager role only)

### 3. Initiate Stock Transfer
Creates a new pending stock transfer, reserving (deducting) the requested quantity immediately from the source branch stock and logging a reservation log.

*   **Endpoint**: `POST /api/stocktransfers`
*   **Authentication**: Bearer JWT (Owner or Manager role only. Managers can only transfer from their assigned branch.)
*   **Request Body**:
    ```json
    {
      "productId": "6f5b5480-b8f7-4f3e-9d2f-910049272ba6",
      "sourceBranchId": "d850d7f0-588f-4a79-892a-cc6b0bc00461",
      "targetBranchId": "1c449042-fd31-4da6-b315-2c5a98316aab",
      "quantity": 15,
      "notes": "Restocking Pepsi in Beta"
    }
    ```
*   **Success Response** (201 Created)

### 4. Approve Stock Transfer
Approves a pending stock transfer, adding the reserved quantity to the destination branch stock and logging an inbound audit trail.

*   **Endpoint**: `PUT /api/stocktransfers/{id}/approve`
*   **Authentication**: Bearer JWT (Owner or Manager role only. Managers can only approve incoming transfers to their assigned branch.)
*   **Request Body**:
    ```json
    {
      "notes": "Received in good condition"
    }
    ```

### 5. Reject Stock Transfer
Rejects a pending stock transfer, returning the reserved stock quantity back to the source branch and logging a return log.

*   **Endpoint**: `PUT /api/stocktransfers/{id}/reject`
*   **Authentication**: Bearer JWT (Owner or Manager role only. Managers can only reject incoming transfers to their assigned branch.)
*   **Request Body**:
    ```json
    {
      "rejectionReason": "No warehouse space"
    }
    ```

### 6. Cancel Stock Transfer
Cancels a pending stock transfer, returning the reserved stock quantity back to the source branch and logging a return log.

*   **Endpoint**: `PUT /api/stocktransfers/{id}/cancel`
*   **Authentication**: Bearer JWT (Owner or Manager role only. Managers can only cancel transfers initiated by their assigned branch.)
*   **Request Body**:
    ```json
    {
      "notes": "Cancelled by initiator"
    }
    ```

---

## POS & Transaction Endpoints

### 1. Checkout (Create Sale)
Processes and records a new transaction, adjusting product stock levels and recording adjustment logs. Handles cash, card, and mixed payments. Automatically enforces cashier manual discount thresholds (max 15% and $50.00).

*   **Endpoint**: `POST /api/sales`
*   **Authentication**: Bearer JWT (Owner, Manager, Cashier)
*   **Request Body**:
    ```json
    {
      "branchId": "bb49ff14-75e1-45a2-b7f9-762d2cfac664",
      "subtotal": 100.00,
      "discountAmount": 10.00,
      "taxAmount": 5.00,
      "total": 95.00,
      "paymentMethod": 2, 
      "paymentDetails": "{\"Cash\": 50.00, \"Card\": 45.00}",
      "appliedCouponCode": "SAVE10",
      "items": [
        {
          "productId": "6f5b5480-b8f7-4f3e-9d2f-910049272ba6",
          "quantity": 2,
          "unitPrice": 50.00,
          "discountAmount": 10.00,
          "total": 90.00
        }
      ]
    }
    ```
*   **Success Response** (200 OK):
    ```json
    {
      "id": "a8a62bc7-76ca-4824-ac16-ecf816a67e64",
      "businessId": "3bf1cb2c-7844-4515-8a87-c2d3a97ef7d0",
      "branchId": "bb49ff14-75e1-45a2-b7f9-762d2cfac664",
      "userId": "d747a83d-3bf1-4521-ba80-c11f7c10b784",
      "subtotal": 100.00,
      "discountAmount": 10.00,
      "taxAmount": 5.00,
      "total": 95.00,
      "paymentMethod": "Mixed",
      "paymentDetails": "{\"Cash\": 50.00, \"Card\": 45.00}",
      "appliedCouponId": "59e68a77-b9f6-48fe-9a71-2ad306a4b15e",
      "appliedCouponCode": "SAVE10",
      "createdAt": "2026-06-09T11:42:00Z"
    }
    ```

### 2. Get Sales History
Retrieves transaction records. Bounded by the active business tenant and branch context.
*Note: Users with the `Cashier` role will only receive sales transactions that they personally processed (isolated by User ID).*

*   **Endpoint**: `GET /api/sales`
*   **Authentication**: Bearer JWT (All authenticated users)
*   **Query Parameters**:
    *   `startDate` (string, optional) - Filter sales from UTC timestamp
    *   `endDate` (string, optional) - Filter sales to UTC timestamp
*   **Success Response** (200 OK):
    ```json
    [
      {
        "id": "a8a62bc7-76ca-4824-ac16-ecf816a67e64",
        "subtotal": 100.00,
        "discountAmount": 10.00,
        "taxAmount": 5.00,
        "total": 95.00,
        "paymentMethod": "Mixed",
        "createdAt": "2026-06-09T11:42:00Z"
      }
    ]
    ```

### 3. Get Sale Details
Retrieves details of a specific sale.
*Note: Users with the `Cashier` role are restricted to checking only their own sales. Attempting to query details for a sale processed by someone else will return `403 Forbidden`.*

*   **Endpoint**: `GET /api/sales/{id}`
*   **Authentication**: Bearer JWT (All authenticated users)

### 4. Get Cashier Statistics
Compiles daily, weekly, monthly, and lifetime sales metrics isolated strictly to the calling cashier's context.

*   **Endpoint**: `GET /api/sales/cashier-stats`
*   **Authentication**: Bearer JWT (Cashier only)
*   **Success Response** (200 OK):
    ```json
    {
      "todaySalesAmount": 150.00,
      "todaySalesCount": 5,
      "weeklySalesAmount": 950.00,
      "weeklySalesCount": 32,
      "monthlySalesAmount": 4200.00,
      "monthlySalesCount": 140,
      "lifetimeSalesAmount": 12500.00,
      "lifetimeSalesCount": 420,
      "averageTransactionValue": 29.76,
      "paymentMethodAmounts": {
        "Cash": 5500.00,
        "POS": 4500.00,
        "Transfer": 2000.00,
        "Mixed": 500.00
      },
      "paymentMethodCounts": {
        "Cash": 210,
        "POS": 140,
        "Transfer": 55,
        "Mixed": 15
      },
      "topProducts": [
        {
          "productName": "Wireless Mouse",
          "quantitySold": 52,
          "totalRevenue": 2600.00
        }
      ],
      "dailySalesTrend": [
        {
          "date": "2026-06-09",
          "amount": 150.00,
          "count": 5
        }
      ]
    }
    ```

### 5. Public Receipt Verification
An anonymous unauthenticated endpoint to verify receipt authenticity. Bypasses standard logical tenant query filters. Exposes customer-safe transaction info (hides cost prices and profit margins).

*   **Endpoint**: `GET /api/sales/verify/{id}`
*   **Authentication**: None (Public Access)
*   **Success Response** (200 OK):
    ```json
    {
      "saleId": "a8a62bc7-76ca-4824-ac16-ecf816a67e64",
      "businessName": "Vendora POS Pro",
      "branchName": "Branch Alpha",
      "branchAddress": "123 Main Street",
      "branchPhone": "555-0199",
      "cashierName": "Cathy Cashier",
      "subtotal": 100.00,
      "discountAmount": 10.00,
      "taxAmount": 5.00,
      "total": 95.00,
      "paymentMethod": "Mixed",
      "createdAt": "2026-06-09T11:42:00Z",
      "items": [
        {
          "productName": "Wireless Mouse",
          "quantity": 2,
          "unitPrice": 50.00,
          "total": 90.00
        }
      ]
    }
    ```

---

## Promotions & Discount Endpoints

### 1. Get Discounts
Retrieves active or all discounts for the business.

*   **Endpoint**: `GET /api/discounts`
*   **Authentication**: Bearer JWT (All authenticated users)

### 2. Create Discount
Creates a new discount campaign.

*   **Endpoint**: `POST /api/discounts`
*   **Authentication**: Bearer JWT (Owner, Manager)
*   **Request Body**:
    ```json
    {
      "name": "Summer Special",
      "description": "10% off laptop sales",
      "type": 0,
      "value": 10.00,
      "target": 0,
      "productId": "dc1295ca-9743-43b1-8e40-e7af6870490a",
      "startDate": "2026-06-01T00:00:00Z",
      "endDate": "2026-08-31T23:59:59Z"
    }
    ```

### 3. Update Discount
Updates an existing discount campaign.

*   **Endpoint**: `PUT /api/discounts/{id}`
*   **Authentication**: Bearer JWT (Owner, Manager)

### 4. Delete Discount
Removes or deactivates a discount campaign.

*   **Endpoint**: `DELETE /api/discounts/{id}`
*   **Authentication**: Bearer JWT (Owner, Manager)

### 5. Get Coupons
Lists all coupons registered for the business.

*   **Endpoint**: `GET /api/coupons`
*   **Authentication**: Bearer JWT (Owner, Manager)

### 6. Validate Coupon
Validates a coupon code against usage limits, minimum order spend, and date constraints. Returns the applied value.

*   **Endpoint**: `GET /api/coupons/validate/{code}`
*   **Authentication**: Bearer JWT (All authenticated users)
*   **Query Parameters**:
    *   `cartTotal` (decimal, required) - Current cart subtotal
*   **Success Response** (200 OK):
    ```json
    {
      "isValid": true,
      "couponId": "59e68a77-b9f6-48fe-9a71-2ad306a4b15e",
      "code": "SAVE10",
      "type": "Percentage",
      "value": 10.00,
      "minCartAmount": 50.00,
      "message": "Coupon applied successfully."
    }
    ```

### 7. Create Coupon
Creates a new unique coupon code.

*   **Endpoint**: `POST /api/coupons`
*   **Authentication**: Bearer JWT (Owner, Manager)
*   **Request Body**:
    ```json
    {
      "code": "SAVE10",
      "type": 0,
      "value": 10.00,
      "minCartAmount": 50.00,
      "usageLimit": 100,
      "startDate": "2026-06-09T00:00:00Z",
      "endDate": "2026-07-09T00:00:00Z"
    }
    ```

---

## Receipt Customization Endpoints

### 1. Get Receipt Settings
Fetches the active receipt settings configuration. Checks for a branch-specific override before falling back to the business default settings context.

*   **Endpoint**: `GET /api/receipts`
*   **Authentication**: Bearer JWT (Owner, Manager)
*   **Query Parameters**:
    *   `branchId` (uuid, optional) - Specific branch override lookup (For Owners; Managers are locked to their own branch context)
*   **Success Response** (200 OK):
    ```json
    {
      "id": "019ea81b-85fa-76d1-a9f8-12cd2fa5b78d",
      "businessId": "3bf1cb2c-7844-4515-8a87-c2d3a97ef7d0",
      "businessName": "Super POS Corp",
      "branchId": "bb49ff14-75e1-45a2-b7f9-762d2cfac664",
      "logoUrl": "http://localhost:5149/uploads/logos/logo.png",
      "headerText": "Welcome to Super POS!",
      "footerText": "Thank you for shopping with us!",
      "showLogo": true,
      "showBranchDetails": true,
      "showCashierInfo": true,
      "showQRCode": true,
      "receiptLayout": "Thermal",
      "customBrandingColor": "#6366F1"
    }
    ```

### 2. Update Receipt Settings
Updates or initializes a custom receipt layout setting context.

*   **Endpoint**: `PUT /api/receipts`
*   **Authentication**: Bearer JWT (Owner, Manager)
*   **Request Body**:
    ```json
    {
      "branchId": "bb49ff14-75e1-45a2-b7f9-762d2cfac664",
      "logoUrl": "http://localhost:5149/uploads/logos/logo.png",
      "headerText": "Welcome to Branch Alpha!",
      "footerText": "Keep your receipt for returns",
      "showLogo": true,
      "showBranchDetails": true,
      "showCashierInfo": true,
      "showQRCode": true,
      "receiptLayout": "A4",
      "customBrandingColor": "#EF4444"
    }
    ```

### 3. Upload Logo Image
Handles multipart file upload for branded receipt logos. Only permits JPG/PNG formats under 2MB. Saves images in the application's local `wwwroot/uploads/logos/` path.

*   **Endpoint**: `POST /api/receipts/upload-logo`
*   **Authentication**: Bearer JWT (Owner, Manager)
*   **Content-Type**: `multipart/form-data`
*   **Request Payload**: File binary under key `file`.
*   **Success Response** (200 OK):
    ```json
    {
      "logoUrl": "http://localhost:5149/uploads/logos/unique-filename.png"
    }
    ```

