# Changelog - Vendora POS Pro

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

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
