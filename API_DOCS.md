# API Documentation - Vendora Inventory Management System

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

### 3. Get Owner Dashboard Stats
Retrieves consolidated, cross-business statistics, branch comparisons, daily trends, cashier metrics, and top products across all businesses owned by the authenticated Owner user. Supports scoping metrics to a specific business or branch via query parameters.

*   **Endpoint**: `GET /api/businesses/owner-stats`
*   **Authentication**: Bearer JWT (Owner role only)
*   **Query Parameters**:
    *   `businessId` (uuid, optional) - Scope metrics to a specific business. If omitted, uses active business context or consolidates across all owned businesses.
    *   `branchId` (uuid, optional) - Scope metrics to a specific branch. If provided, `businessId` is also required.
*   **Success Response** (200 OK):
    ```json
    {
      "totalRevenue": 23.76,
      "totalProfit": 15.00,
      "totalSalesCount": 2,
      "averageTransactionValue": 11.88,
      "profitMargin": 63.13,
      "businessMetrics": [
        {
          "businessId": "85bc4e99-1e86-40b0-a350-6bae0fc92220",
          "businessName": "Oliver Bakery 1509406149",
          "revenue": 10.80,
          "profit": 6.00,
          "salesCount": 1
        },
        {
          "businessId": "837a52aa-1fa6-46d7-9ab9-2d5b42ebc18c",
          "businessName": "Oliver Cafe 1509406149",
          "revenue": 12.96,
          "profit": 9.00,
          "salesCount": 1
        }
      ],
      "branchMetrics": [
        {
          "branchId": "c8d880c9-9b12-43c7-9cef-12c788e9d005",
          "branchName": "Oliver Bakery Branch",
          "businessName": "Oliver Bakery 1509406149",
          "revenue": 10.80,
          "profit": 6.00,
          "salesCount": 1
        }
      ],
      "topProducts": [
        {
          "productId": "6f5b5480-b8f7-4f3e-9d2f-910049272ba6",
          "productName": "Coffee",
          "sku": "COF-01",
          "quantitySold": 3,
          "totalRevenue": 12.00,
          "totalProfit": 9.00
        }
      ],
      "topCashiers": [
        {
          "cashierId": "019ea7a1-9023-748d-9ca3-f9050db997f7",
          "cashierName": "Charlie Cashier",
          "branchName": "Oliver Cafe Branch",
          "revenue": 12.96,
          "salesCount": 1
        }
      ],
      "dailySalesTrend": [
        {
          "date": "2026-06-09",
          "revenue": 23.76,
          "profit": 15.00,
          "salesCount": 2
        }
      ]
    }
    ```

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

*Note: This endpoint is also used by the frontend to sequentially synchronize offline transactions queued in the browser's localStorage when connectivity is restored.*

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
      "businessName": "Vendora Inventory Management System",
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

### 6. Refund Sale
Flags a sale transaction as refunded, increments corresponding product stocks back to the branch's inventory, writes stock adjustment logs, and records audit trail logs. Restricted to owners and managers.

*   **Endpoint**: `POST /api/sales/{id}/refund`
*   **Authentication**: Bearer JWT (Owner, Manager)
*   **Success Response** (200 OK):
    ```json
    {
      "message": "Transaction refunded successfully."
    }
    ```
*   **Error Response** (400 Bad Request):
    ```json
    {
      "message": "This transaction has already been refunded."
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

---

## Audit Log Endpoints

### 1. Get Audit Logs
Retrieves the business tenant's audit logs, tracking login activity, sales checkouts, coupons applications, stock adjustments/transfers, and refunds. Restricted to owners and managers.

*   **Endpoint**: `GET /api/audit-logs`
*   **Authentication**: Bearer JWT (Owner, Manager)
*   **Success Response** (200 OK):
    ```json
    [
      {
        "id": "e2a3b04c-cf4d-4be9-81a1-9a7c8d8b9e0f",
        "action": "SaleRefunded",
        "details": "Refunded sale 050a8f6f-0205-44b3-a35e-e623a3f1d0e1 for total: $200.00. Restored stock for 1 products",
        "actorEmail": "owner@example.com",
        "ipAddress": "127.0.0.1",
        "timestamp": "2026-06-10T22:24:20Z"
      }
    ]
    ```

---

## Super Admin Control Endpoints (SuperAdmin Role Only)

These endpoints are strictly restricted to users with the `SuperAdmin` role.

### 1. Get Platform Statistics
Retrieves global KPIs across the platform including counts, revenue, and registration trends.

*   **Endpoint**: `GET /api/superadmin/stats`
*   **Authentication**: Bearer JWT (SuperAdmin role)
*   **Success Response** (200 OK):
    ```json
    {
      "totalBusinesses": 10,
      "activeBusinesses": 8,
      "suspendedBusinesses": 2,
      "activeSubscriptions": 8,
      "totalSaaSRevenue": 2392.00,
      "monthlySaaSRevenue": 199.33,
      "totalBranches": 12,
      "totalUsers": 25,
      "businessGrowthTrend": [
        {
          "date": "2026-06-03",
          "businessesCreated": 0
        },
        {
          "date": "2026-06-09",
          "businessesCreated": 1
        }
      ]
    }
    ```

### 2. Get All Businesses
Retrieves all businesses on the platform including deactivated ones, displaying cross-tenant stats and subscription details.

*   **Endpoint**: `GET /api/superadmin/businesses`
*   **Authentication**: Bearer JWT (SuperAdmin role)
*   **Success Response** (200 OK):
    ```json
    [
      {
        "id": "3bf1cb2c-7844-4515-8a87-c2d3a97ef7d0",
        "name": "Super POS Corp",
        "subdomain": "superpos",
        "ownerName": "John Doe",
        "ownerEmail": "john@example.com",
        "createdAt": "2026-06-01T12:00:00Z",
        "isActive": true,
        "branchesCount": 2,
        "usersCount": 5,
        "subscriptionTier": "Pro",
        "subscriptionStatus": "Active",
        "subscriptionPrice": 299.00,
        "subscriptionExpiresAt": "2027-06-01T12:00:00Z",
        "totalSalesRevenue": 15420.50
      }
    ]
    ```

### 3. Suspend Business
Suspends a business tenant. When a tenant is suspended, any attempts to log into the business or perform operations will return a 403 Forbidden status with a suspension message.

*   **Endpoint**: `POST /api/superadmin/businesses/{id}/suspend`
*   **Authentication**: Bearer JWT (SuperAdmin role)
*   **Success Response** (200 OK):
    ```json
    {
      "message": "Business suspended successfully."
    }
    ```
*   **Error Response** (400 Bad Request):
    ```json
    {
      "message": "Business is already suspended."
    }
    ```

### 4. Activate Business
Re-activates a suspended business tenant, restoring full platform and API access.

*   **Endpoint**: `POST /api/superadmin/businesses/{id}/activate`
*   **Authentication**: Bearer JWT (SuperAdmin role)
*   **Success Response** (200 OK):
    ```json
    {
      "message": "Business activated successfully."
    }
    ```
*   **Error Response** (400 Bad Request):
    ```json
    {
      "message": "Business is already active."
    }
    ```

### 5. Update Subscription Details
Updates a business's subscription plan, price, status, and expiration date.

*   **Endpoint**: `PUT /api/superadmin/businesses/{id}/subscription`
*   **Authentication**: Bearer JWT (SuperAdmin role)
*   **Request Body**:
    ```json
    {
      "subscriptionTier": "Enterprise",
      "subscriptionStatus": "Active",
      "subscriptionPrice": 499.00,
      "subscriptionExpiresAt": "2027-12-31T23:59:59Z"
    }
    ```
*   **Success Response** (200 OK):
    ```json
    {
      "message": "Subscription updated successfully."
    }
    ```

### 6. Get Audit Logs
Retrieves the platform-wide audit log trail, which tracks business activations, suspensions, and subscription changes.

*   **Endpoint**: `GET /api/superadmin/audit-logs`
*   **Authentication**: Bearer JWT (SuperAdmin role)
*   **Success Response** (200 OK):
    ```json
    [
      {
        "id": "5fa23bc8-12cd-48ef-a123-9c87d4fa12ef",
        "action": "BusinessSuspended",
        "details": "Suspended business: Super POS Corp (subdomain: superpos)",
        "userEmail": "admin@vendorapos.com",
        "ipAddress": "127.0.0.1",
        "createdAt": "2026-06-09T15:30:00Z",
        "businessId": "3bf1cb2c-7844-4515-8a87-c2d3a97ef7d0",
        "businessName": "Super POS Corp"
      }
    ]
    ```

---

# XIV. Billing & Stripe Integration

Endpoints in this section are restricted to users with the `Owner` role. They enable managing plan subscriptions, initiating Stripe checkouts, and opening the Stripe customer billing portal.

### 1. Get Subscription Status
Retrieves current plan information and Stripe metadata for the owner's active business context.

*   **Endpoint**: `GET /api/billing/status`
*   **Authentication**: Bearer JWT (Owner role)
*   **Success Response** (200 OK):
    ```json
    {
      "id": "607ab0ef-9e31-41a7-a32c-9f6340eb4d84",
      "name": "Oliver Billing Bakery",
      "subscriptionTier": "Basic",
      "subscriptionStatus": "Active",
      "subscriptionPrice": 99.00,
      "subscriptionExpiresAt": "2026-07-09T23:07:12.003Z",
      "stripeCustomerId": "cus_mock_1817892119",
      "stripeSubscriptionId": "sub_mock_1817892119",
      "isMockMode": true
    }
    ```

### 2. Initiate Subscription Checkout
Generates a Stripe Checkout Session URL redirect link for subscribing or upgrading a plan.

*   **Endpoint**: `POST /api/billing/checkout`
*   **Authentication**: Bearer JWT (Owner role)
*   **Request Body**:
    ```json
    {
      "tier": "Basic",
      "billingCycle": "Monthly",
      "successUrl": "http://localhost:3000/success",
      "cancelUrl": "http://localhost:3000/cancel"
    }
    ```
*   **Success Response** (200 OK):
    ```json
    {
      "checkoutUrl": "http://localhost:3000/success?session_id=mock_session_e9ab20ce-9877-4304-879e-8c2fef523a1b&businessId=607ab0ef-9e31-41a7-a32c-9f6340eb4d84&tier=Basic&billingCycle=Monthly"
    }
    ```

### 3. Open Stripe Customer Portal
Generates a self-service customer portal session redirect link where owners can update payment details or manage plans.

*   **Endpoint**: `POST /api/billing/portal`
*   **Authentication**: Bearer JWT (Owner role)
*   **Request Body**:
    ```json
    {
      "returnUrl": "http://localhost:3000/dashboard/billing"
    }
    ```
*   **Success Response** (200 OK):
    ```json
    {
      "portalUrl": "/mock-stripe-portal?businessId=607ab0ef-9e31-41a7-a32c-9f6340eb4d84&returnUrl=http%3A%2F%2Flocalhost%3A3000%2Fdashboard%2Fbilling"
    }
    ```

---

# XV. Webhooks

Public endpoints to receive events from external service integrations.

### 1. Stripe Webhook Listener
Receives Stripe webhook notifications. Handled dynamically under simulated/mock mode or verified real modes.

*   **Endpoint**: `POST /api/webhooks/stripe`
*   **Authentication**: None (Public Access)
*   **Headers**:
    *   `Stripe-Signature` (string, required in real mode) - Verification signature header. Bypassed in mock mode.
*   **Request Body**: Stripe Event Object (JSON).
*   **Events Processed**:
    *   `checkout.session.completed`
    *   `invoice.payment_succeeded`
    *   `invoice.payment_failed`
    *   `customer.subscription.updated`
    *   `customer.subscription.deleted`
*   **Success Response** (200 OK): Empty response body.
*   **Error Response** (400 Bad Request):
    ```json
    {
      "message": "Webhook processing failed."
    }
    ```

---

# XVI. Notifications

Endpoints to manage system notifications (e.g. low stock alerts, subscription reminders).

### 1. Get Notifications
Retrieves the latest 100 notifications for the active business. Scoped by user role context (for instance, managers and cashiers will only see global notifications or those scoped to their active branch).

*   **Endpoint**: `GET /api/notifications`
*   **Authentication**: Bearer JWT (All authenticated users)
*   **Success Response** (200 OK):
    ```json
    [
      {
        "id": "e5b8d277-2f1d-4560-bf8f-8d9e0f34ac23",
        "recipientEmail": "owner@example.com",
        "title": "Low Stock Alert: Alert Product",
        "message": "Product 'Alert Product' (SKU: ALT-SKU-123) in branch 'North Branch' is low on stock. Current quantity: 4, Min Stock Level: 5.",
        "type": "LowStock",
        "channel": "Email",
        "isRead": false,
        "timestamp": "2026-06-10T22:31:30Z",
        "readAt": null
      }
    ]
    ```

### 2. Mark Notification as Read
Marks a specific notification as read.

*   **Endpoint**: `PUT /api/notifications/{id}/read`
*   **Authentication**: Bearer JWT (All authenticated users)
*   **Success Response** (200 OK):
    ```json
    {
      "message": "Notification marked as read successfully."
    }
    ```
*   **Error Response** (404 Not Found):
    ```json
    {
      "message": "Notification not found."
    }
    ```

### 3. Check Subscription Reminders
Triggers a sweep check on all active businesses. For any subscription expiring within 30 days, generates a reminder alert (with 7-day duplicate spam prevention). Restricted to Owners and SuperAdmins.

*   **Endpoint**: `POST /api/notifications/check-subscription-reminders`
*   **Authentication**: Bearer JWT (Owner, SuperAdmin)
*   **Success Response** (200 OK):
    ```json
    {
      "message": "Subscription reminders check completed successfully."
    }
    ```




