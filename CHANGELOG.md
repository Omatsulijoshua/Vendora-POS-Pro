# Changelog - Vendora POS Pro

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.10.0] - 2026-06-09

### Added
- **Cashier Dashboard (Personal Tracking & Metrics) (Phase 11):**
  - Created backend DTOs for cashier statistics calculations: `CashierStatsDto.cs`, `TopProductDto`, and `DailySaleTrendDto`.
  - Implemented `GET /api/sales/cashier-stats` endpoint in `SalesController.cs` returning isolated daily, weekly, monthly, lifetime statistics, payment breakdowns, top-selling products, and 7-day trend arrays.
  - Enforced data isolation at the database level: cashier queries on sales listing (`GET /api/sales`) and details lookup (`GET /api/sales/{id}`) are restricted to the cashier's own processed sales, throwing `403 Forbidden` on access violations.
  - Added navigation tabs switcher on Cashier Dashboard: "New Sale (Register)" vs "History & Performance".
  - Designed premium glassmorphic KPI cards for Today's Sales, Weekly Sales, Monthly Sales, Lifetime Sales, and Average Transaction Value.
  - Rendered detailed cashier personal transaction history table with invoice formatting and receipt print triggers.
  - Built custom Tailwind/CSS components (progress bars and vertical graphs) for product volume ratios and daily sales performance trends without external graphing packages.
  - Fixed syntax compilation issues on frontend cashier and manager dashboards (unclosed JSX container and try-catch braces).
  - Created and executed PowerShell verification script `verify_phase11.ps1`.

## [0.9.0] - 2026-06-09

### Added
- **Receipt System (Customizable) (Phase 10):**
  - Created domain entity `ReceiptSetting` to store logo path, headers, footers, display toggles, layouts (Thermal vs A4), and hex branding color.
  - Setup DbSet configurations, unique constraints (one settings context per branch/business), global query filters, and generated migration `AddReceiptCustomization`.
  - Implemented `ReceiptsController` with endpoints to retrieve, update, and upload brand logo images (handling size limits and file extensions).
  - Configured static file routing (`UseStaticFiles`) to serve logo assets from `wwwroot/uploads/logos/`.
  - Added public unauthenticated verification endpoint `GET /api/sales/verify/{id}` using `VerifiedSaleDto` to hide profit margins and cost prices.
  - Built public verification frontend route `/verify-receipt/[id]` to display digital validation.
  - Updated Cashier dashboard with customizable print preview modal and media print layout styling.
  - Built Receipt Settings tab in Owner and Manager dashboards with live previews and logo uploads.
  - Created and executed PowerShell verification script `verify_phase10.ps1`.

## [0.8.0] - 2026-06-09

### Added
- **Discounts & Coupons System (Phase 9):**
  - Created domain entities `Discount` and `Coupon` with enums `DiscountType` and `DiscountTarget`.
  - Updated `Sale` table with coupon auditing columns `AppliedCouponId` and `AppliedCouponCode`.
  - Configured query filters, decimal precision, unique index per business on coupon codes, and applied migration `AddPromoSystem`.
  - Implemented `DiscountsController` and `CouponsController` CRUD endpoints.
  - Created a real-time coupon code validation endpoint (`GET /api/coupons/validate/{code}`).
  - Integrated validation checks during Checkout:
    - Enforced Cashier manual discount limits (max $50.00 and 15% subtotal).
    - Validated and decremented coupon usage counts.
  - Updated Cashier dashboard with coupon input fields, real-time code validations, and cashiers manual limit warnings.
  - Updated Owner/Manager dashboards with Promotions management tab.
  - Created and executed PowerShell verification script `verify_phase9.ps1`.

## [0.7.0] - 2026-06-09

### Added
- **POS System Core (Phase 8):**
  - Created domain models `Sale` and `SaleItem` along with payment method enums.
  - Configured relationships, cascade rules, decimal precision, global query filters, and applied migration `AddSalesSystem`.
  - Implemented `SalesController` with transaction locking (`SemaphoreSlim`), stock validation/deduction, and branch isolation.
  - Updated Cashier dashboard with checkout cart, payment type selectors (Cash, Card, Mixed), split payment math validations, and print-styled thermal receipt outputs.
  - Updated Owner and Manager dashboards with transaction history listings, detailed receipt lookups, and sales metrics cards.
  - Created and executed PowerShell verification script `verify_phase8.ps1`.

## [0.6.0] - 2026-06-09

### Added
- **Stock Transfer System (Phase 7):**
  - Created domain model `StockTransfer` with enum `TransferStatus` (Pending, Approved, Rejected, Cancelled).
  - Configured schema relationships, indexes, query filters in `ApplicationDbContext`, generated and applied migration `AddStockTransferSystem`.
  - Implemented `StockTransfersController` REST endpoints (Initiate, Approve, Reject, Cancel, List, Get) with strict multi-tenant context.
  - Implemented automatic inventory reservation (deducting stock immediately at source branch) and restoration logic upon rejection or cancellation.
  - Enforced security constraints: Cashiers are completely forbidden (403 Forbidden); Managers can only initiate/cancel from their own branch and resolve incoming to their own branch.
  - Disabled stock transfers when `SharedStockMode` setting is active.
  - Built out Owner Dashboard Stock Transfers panel with listings, initiate modal, and approval/rejection/cancellation controls.
  - Built out Manager Dashboard Stock Transfers panel with destination branch selection and custom action triggers scoped to branch context.
  - Added list branches access support for the `Manager` role.
  - Created and executed a comprehensive PowerShell integration test suite (`verify_phase7.ps1`).

## [0.5.0] - 2026-06-09

### Added
- **Inventory Management System (Phase 6):**
  - Created domain entities `Category`, `Product`, `ProductStock`, and `StockAdjustmentLog`.
  - Configured composite uniqueness indexes (SKU & Barcode per business context) and database relationships.
  - Setup and ran database migrations (`AddInventorySystem`).
  - Added `SharedStockMode` setting flag to `Business` model.
  - Implemented `CategoriesController` with complete tenant-isolated CRUD operations.
  - Implemented `ProductsController` supporting CRUD, text search, barcode lookup, adjustment log histories, and stock level controls.
  - Added stock consolidation and aggregation mechanics on switching stock modes (Shared vs Branch mode) in `BusinessesController`.
  - Built out the Owner Dashboard with Categories management, Products catalogs, Low Stock alerts, and Shared Stock setting toggle.
  - Built out the Manager Dashboard with branch-scoped catalog views, stock adjustment notes, and logs tracking.
  - Built out the Cashier Dashboard with catalog lookups, keyword searches, and a simulated barcode checkout scanner.
  - Implemented robust `verify_phase6.ps1` PowerShell integration test suite.
  - Fixed required user filters causing log audit omissions by implementing query filter bypass (`IgnoreQueryFilters`) with manual tenant/branch context filters.
  - Renamed branch to `main`, resolved git cache conflicts, and pushed code to `https://github.com/Omatsulijoshua/Vendora-POS-Pro`.

## [0.4.0] - 2026-06-08

### Added
- **User & Staff Management - RBAC Expansion (Phase 5):**
  - Added `IsActive` property to `User` entity to support staff deactivation workflows.
  - Augmented `ITenantProvider` and `HttpContextTenantProvider` to support active branch-scoped contexts.
  - Configured dynamic EF Core global query filters for `User` and `Branch` entities.
  - Enforced `IsActive` constraints during login in `AuthController`.
  - Exposed `toggle-active` endpoint in `StaffController`.
  - Updated Owner Dashboard Staff management table with active/deactive toggle buttons.
  - Implemented and successfully ran integration test suite `verify_phase5.ps1`.

## [0.3.0] - 2026-06-08

### Added
- **Multi-Branch Management System (Phase 4):**
  - Created backend DTOs: `CreateBranchDto`, `BranchDto`, `CreateStaffDto`, and `StaffDto`.
  - Implemented `BranchesController` allowing owners to retrieve branches under their active business (`GET /api/branches`), create branches (`POST /api/branches`), and fetch branch details (`GET /api/branches/{id}`).
  - Updated `GetBranch` action in `BranchesController` to allow Managers and Cashiers to query their own branch details while enforcing data authorization checks.
  - Implemented `StaffController` allowing owners to register Managers/Cashiers (`POST /api/staff`) and retrieve the staff list filtered by active branch context (`GET /api/staff`).
  - Added dynamic branch context switching endpoint (`POST /api/auth/switch-branch/{branchId}`) in `AuthController` to update the active `branch_id` claim in the session JWT.
  - Implemented `switchBranch` action in frontend `AuthContext` to hot-swap tokens.
  - Redesigned the Owner Dashboard layout with:
    - **Branch Switcher Dropdown** in the header.
    - **Add Branch modal** to register locations under the current business.
    - **Add Staff modal** to invite cashiers/managers and bind them to branches.
    - Real-time branch data isolation and staff directory updates on selections.
  - Updated the **Manager Dashboard** and **Cashier Dashboard** to fetch and display their assigned branch name dynamically on mount.
  - Created and executed a PowerShell integration verification script for Phase 4.

## [0.2.0] - 2026-06-08

### Added
- **Multi-Business Ownership System (Phase 3):**
  - Created backend DTOs: `CreateBusinessDto` and `BusinessDto` under Application layer.
  - Implemented `BusinessesController` allowing authenticated owners to retrieve all owned brands (`GET /api/businesses/my-businesses`) and register new business entities (`POST /api/businesses`).
  - Added dynamic context switching endpoint (`POST /api/auth/switch-business/{businessId}`) in `AuthController` to hot-swap active tenants in user database records and issue updated JWT session tokens.
  - Modified frontend `AuthContext` to expose `switchBusiness` token replacements dynamically.
  - Redesigned the Owner Dashboard layout with:
    - Interactive **Business Switcher Dropdown** in the navbar.
    - **Add Business dialog/modal** to register additional store properties.
    - Dynamic data loading displaying isolated stats, branch locations, and staff directories per selected active business.
  - Created and executed integration verification scripts for Phase 3 validating the full multi-business workflow.

## [0.1.0] - 2026-06-08

### Added
- Setup of local development environment (installed .NET 10 SDK and PostgreSQL 18 via Scoop).
- Configured PostgreSQL to listen on port 5433 to avoid host port conflicts.
- Initialized project tracking and architectural documentation files:
  - `PROJECT_PROGRESS.md`
  - `ARCHITECTURE.md`
  - `DATABASE_SCHEMA.md`
  - `API_DOCS.md`
  - `CHANGELOG.md`
