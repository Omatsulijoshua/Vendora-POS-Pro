# Changelog - Vendora POS Pro

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.18.0] - 2026-06-11

### Added
- **Full System Testing (Phase 19):**
  - **Comprehensive Integration Test Suite**: Developed `verify_phase19_system_testing.ps1` to validate the entire platform's security boundaries, transactional processes, and operational gates.
  - **Multi-Business Isolation**: Validated that cross-tenant read/write/update operations (e.g. products, categories) are strictly blocked by EF Core query filters and tenant checks, returning `404 Not Found` or `403 Forbidden`.
  - **Multi-Branch Isolation**: Validated branch security scopes, ensuring that Branch managers and cashiers are blocked from mutating or retrieving resources of other branches under the same tenant.
  - **POS Flow & Inventory Calculations**: Verified checkout calculations, stock level deductions on sales, manual stock adjustments, and real-time validation of cashier discount limits (max 15%).
  - **Stock Transfer Verification**: Tested stock transfers with immediate stock reservation locks (reductions) in source branch and subsequent additions in target branch upon manager/owner approval.
  - **Receipt Customization & Public verification**: Verified receipt settings mutations and tested the unauthenticated public verification endpoint `/api/sales/verify/{id}`.
  - **Coupon Validation Logic**: Tested coupon code date windowing, minimum spend requirements, usage tracking, and discount application.
  - **Subscription Enforcement Gating**: Verified login blocks (`402 Payment Required`) for cashier staff under expired plans, owner access with active flags disabled, and full dashboard blocking (`403 Forbidden`) on suspended tenants.

## [0.17.0] - 2026-06-11

### Added
- **Final System Hardening (Phase 18):**
  - **Database Indexing**: Configured explicit PostgreSQL database indexes inside `ApplicationDbContext.cs` on logical multi-tenant foreign keys, date columns, and search columns for entities: `Branch`, `User`, `Product`, `ProductStock`, `StockAdjustmentLog`, `StockTransfer`, `Sale`, `SaleItem`, `Discount`, `AuditLog`, and `Notification`.
  - **EF Core API Optimizations**: Injected `.AsNoTracking()` on read-only queries across controllers (`AuditLogsController`, `NotificationsController`, `SuperAdminController`, `SalesController`, and `ProductsController`) to disable entity-tracking overhead, reducing memory footprint and presentation layer latency.
  - **Role Security Audit & Verification**: Created a PowerShell integration test suite (`verify_phase18_hardening.ps1`) validating RBAC access boundaries:
    - Cashiers are forbidden from accessing audit logs, SuperAdmin endpoints, creating/updating/deleting products, and manual stock adjustments.
    - Managers are forbidden from accessing SuperAdmin endpoints, and creating/updating/deleting products.
    - Authorized roles (Owners/Managers for audit logs, Cashiers for personal stats, Managers for products catalog listing and assigned branch stock adjustments) succeed as expected.
    - Verified that all hardened query endpoints respond successfully under 400ms.

## [0.16.0] - 2026-06-11

### Added
- **Mobile & Responsive POS (Phase 17):**
  - Refactored the POS Cashier Dashboard `page.tsx` with responsive layout designs:
    - **Desktop (>= 1024px)**: Maintained dual-pane view showing catalog on right and cart receipt on left.
    - **Mobile/Tablet (< 1024px)**: Implemented tabbed selector views toggling between catalog browse and cart receipt lists.
    - **Mobile Floating Bar**: Added sticky bottom action bar displaying total item counts and checkout totals with instant redirect triggers when catalog is active.
    - **Modals**: Resized checkout confirmation and invoice preview modals for mobile viewports using auto-scrolling view wrappers.
  - Implemented client-side offline durability structures:
    - **Product Catalog Cache**: Automatically caches loaded items inside browser `localStorage` (`vendora_cached_products`) and falls back to cache on backend connection failure.
    - **Offline Sales Queue**: When checkouts fail due to network outages, prompts cashiers to check out offline. Creates simulated offline sales logs (with temporary IDs), deducts stock levels locally in browser cache, and queues records inside `vendora_offline_sales`.
    - **Status Bar Widgets**: Added animated connection status indicators (🟢 Online / 🔴 Offline) and sync queue buttons in the cashier navigation header.
    - **Transaction Synchronization**: Built sequential sync handlers to post queued offline transactions to backend API endpoint (`POST /api/sales`) when connectivity returns.

## [0.15.0] - 2026-06-10


### Added
- **Notifications System (Phase 16):**
  - Created domain entity `Notification.cs` to store multi-tenant notifications with title, message, type (LowStock, SubscriptionReminder, General), channel (Email, SMS), read status (`IsRead`, `ReadAt`), and recipient email.
  - Configured `Notifications` DbSet in `ApplicationDbContext` with logical multi-tenant query filter scoped to `ITenantProvider.TenantId` context.
  - Generated and applied EF database migration `AddNotificationsSystem`.
  - Implemented `INotificationService` and `NotificationService` supporting:
    - Stock checks (`CheckAndTriggerLowStockAlertAsync`) to alert owner and managers if item levels fall below configured thresholds (configured in checkout, transfers, or manual adjustments).
    - Subscription scans (`CheckAndTriggerSubscriptionRemindersAsync`) to query subscriptions expiring in <= 30 days and alert owners, featuring 7-day duplicate prevention.
    - Console simulation printing for sent Email/SMS and persistent logging in the audit log database.
  - Implemented `NotificationsController` exposing:
    - `GET /api/notifications` (fetches active notifications context-isolated for current tenant and branch scope).
    - `PUT /api/notifications/{id}/read` (marks specific notification as read).
    - `POST /api/notifications/check-subscription-reminders` (scans expiring business plans, restricted to Owner/SuperAdmin).
  - Developed and integrated `NotificationBell.tsx` component in Next.js frontend to fetch notifications count, display dropdown list of 5 recent alerts, and allow marking them read.
  - Refactored frontend dashboards (`owner/page.tsx` and `manager/page.tsx`) to show the notification bell in the navbar header, and added a dedicated **Notifications** history timeline table tab.
  - Developed and successfully ran PowerShell integration test suite `verify_phase16_notifications.ps1` verifying low stock checkout triggers, mark-as-read updates, subscription date sweeps, spam prevention, and cashier RBAC lockout.

## [0.14.0] - 2026-06-10


### Added
- **Audit Log System & Sales Refunds (Phase 15):**
  - Added `IsRefunded` and `RefundedAt` to the `Sale` model and registered database configurations.
  - Generated and applied database migration `AddSaleRefundColumns`.
  - Created `AuditLogsController` with endpoint `GET /api/audit-logs` restricted to Owner and Manager roles. Projects database keys to `ActorEmail` and `Timestamp` to match user layouts.
  - Integrated scoped `IAuditLogService` across controllers to write audit entries.
  - Configured auth login audits tracking: success, failure, deactivation, suspension, and subscription expiration.
  - Configured promo CRUD audit tracking for coupons and discounts.
  - Configured stock adjustment logs tracking for manual adjustments and stock transfers.
  - Implemented sales refund checkout endpoint `POST /api/sales/{id}/refund` that flags transactions, restores quantities to branch inventory, and logs stock adjustments.
  - Refactored Owner and Manager dashboards to render an **Audit Logs** tab featuring a Chronological log timeline table.
  - Added a **Refund Transaction** button in the sales history receipt modals, which triggers the refund endpoint and updates active quantities.
  - Added a **Refunded** status badge inside sales lists.
  - Developed and successfully verified integration test suite `verify_phase14_auditing.ps1` confirming checkout logging, logins auditing, stock restoration, and role isolation checks.

## [0.13.0] - 2026-06-09

### Added
- **Subscription Billing & Stripe Integration (Phase 14):**
  - Modified the `Business` domain model to include `StripeCustomerId` and `StripeSubscriptionId` properties.
  - Registered property mappings and column maximum lengths in `ApplicationDbContext` and applied database migration `AddStripeSubscriptionMetadata`.
  - Installed the `Stripe.net` NuGet package.
  - Created `IStripeService` and `StripeService` with full Stripe Checkout, Billing Customer Portal, and Webhook processing capabilities.
  - Implemented a robust **Mock Billing Mode** fallback in `StripeService` when keys are set to `"Mock"` or left empty, generating simulation session URLs and parsing simulated webhook payloads without network calls.
  - Created `BillingController` with owner-restricted endpoints: `GET /status`, `POST /checkout` (returns Stripe checkout session URL), and `POST /portal` (returns Stripe billing portal URL).
  - Created `StripeWebhookController` allowing anonymous posts to `/api/webhooks/stripe` to handle events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
  - Integrated subscription operational gating in `AuthController` and token payload generator:
    - Blocked Cashiers and Managers from logging in if the subscription is expired or delinquent, returning `402 Payment Required`.
    - Allowed Owners to log in but set `IsSubscriptionActive` claim/payload flag to false.
  - Updated frontend context `AuthContext.tsx` to decode and store `isSubscriptionActive` from JWT.
  - Redesigned Owner Dashboard `owner/page.tsx` adding a **Billing & Subscriptions** tab featuring pricing cards (Basic, Pro, Enterprise), monthly/yearly interval toggle, and redirects to checkout/portal.
  - Built a glassmorphic **Subscription Expired Lock Overlay** in `owner/page.tsx` that blocks non-billing operations when the subscription is inactive, forcing billing resolution.
  - Developed and successfully ran PowerShell integration test suite `verify_phase14.ps1` confirming checkout redirects, webhook processing, delinquency status changes, and login blocks.

## [0.12.0] - 2026-06-09

### Added
- **Super Admin Dashboard & Platform Controls (Phase 13):**
  - Modified the `Business` domain model adding subscription metadata columns: `SubscriptionTier`, `SubscriptionStatus`, `SubscriptionPrice`, and `SubscriptionExpiresAt`.
  - Created the `AuditLog` domain model to track actions on the platform (suspensions, activations, subscription changes).
  - Registered `AuditLogs` DbSet in `ApplicationDbContext` and configured dynamic query filters.
  - Generated and executed EF Core migration `AddSuperAdminAndSubscriptions` to apply schema changes to PostgreSQL.
  - Created `IAuditLogService` and `AuditLogService` to handle asynchronous audit logging across controllers.
  - Implemented `SuperAdminController` restricting access to the `SuperAdmin` role context (`admin@vendorapos.com`).
  - Added endpoints:
    - `GET /api/superadmin/stats` (Global statistics: business counts, active subscription count, total and monthly SaaS revenue, 7-day registration trend).
    - `GET /api/superadmin/businesses` (Aggregated cross-tenant details, branch counts, user counts, and total sales revenue).
    - `POST /api/superadmin/businesses/{id}/suspend` (Locks a tenant, sets `IsActive = false`, and logs action to audit log).
    - `POST /api/superadmin/businesses/{id}/activate` (Unlocks a tenant, sets `IsActive = true`, and logs action to audit log).
    - `PUT /api/superadmin/businesses/{id}/subscription` (Modifies subscription status, tier, pricing, and expiration date).
    - `GET /api/superadmin/audit-logs` (Retrieves complete audit trail listing with business names).
  - Integrated a business suspension check during login in `AuthController`, returning a `403 Forbidden` status with a descriptive message to block users of suspended businesses from accessing the platform.
  - Rewrote the frontend `super-admin/page.tsx` dashboard with stats widget cards, a search/filter business directory table, subscription tier editing dialogs, suspension/activation buttons, SVG business growth trends, and audit trail timeline widgets.
  - Developed and successfully ran PowerShell integration test suite `verify_phase13.ps1` confirming stats calculations, suspension lockouts, subscription updates, and audit logging.

## [0.11.0] - 2026-06-09

### Added
- **Business Owner Dashboard & Advanced Reports (Phase 12):**
  - Created backend `OwnerDashboardStatsDto.cs` defining consolidated KPIs (Revenue, Profit, ATV, Margin), cross-business analytics, multi-branch comparisons, product leaderboards, cashier performance, and daily trends.
  - Implemented `GET /api/businesses/owner-stats` endpoint in `BusinessesController.cs` for consolidation of metrics across all owned businesses by bypassing global EF Core query filters using `.IgnoreQueryFilters()`.
  - Added support for query parameters (`businessId`, `branchId`) to drill down analytics to a specific business or branch.
  - Secured the endpoint by strictly validating the owner's identity and checking that the target business/branch belongs to them.
  - Refactored `owner/page.tsx` on the frontend with stats fetching hooks and a redesigned glassmorphic Overview dashboard.
  - Rendered consolidated cards for total revenue, profit, average transaction value (ATV), and margin.
  - Created cross-business comparative panel displaying comparative revenue/profit metrics.
  - Added multi-branch comparisons leaderboard rankings table.
  - Plotted 7-day revenue vs profit trends using native CSS/Tailwind-based SVG and markup visualizations.
  - Rendered Top Products (ranked by quantity sold, revenue, and profit) and Top Cashiers (ranked by sales volume and cashier revenue) leaderboards.
  - Developed and successfully ran PowerShell integration test script `verify_phase12.ps1` confirming scoping correctness, data calculations, and access control.

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
