# verify_phase16_notifications.ps1
# Integration test script for Phase 16 - Notifications System

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 16 NOTIFICATIONS SYSTEM TESTS"      -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Setup Tenant and Users
$emailSuffix = Get-Random
$ownerEmail = "notif_owner_$emailSuffix@example.com"
$ownerPassword = "Password123!"
$subdomain = "notif$emailSuffix"

Write-Host "`n[1] Registering a new Owner ($ownerEmail) and Business..." -ForegroundColor Yellow

$registerBody = @{
    firstName = "Notif"
    lastName = "Owner"
    email = $ownerEmail
    password = $ownerPassword
    businessName = "Notification Business $emailSuffix"
    subdomain = $subdomain
} | ConvertTo-Json

$registerRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register-owner" -Method Post -Body $registerBody -Headers $headers
$ownerToken = $registerRes.token
$businessId = $registerRes.businessId
Write-Host "[SUCCESS] Owner registered. Business ID: $businessId" -ForegroundColor Green

$ownerHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ownerToken"
}

# Activate Business Subscription via SuperAdmin so cashier can log in
$superLoginBody = @{
    email = "admin@vendorapos.com"
    password = "AdminPassword123!"
} | ConvertTo-Json
$superLoginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $superLoginBody -Headers $headers
$superToken = $superLoginRes.token
$superHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $superToken"
}
$subBody = @{
    subscriptionTier = "Pro"
    subscriptionStatus = "Active"
    subscriptionPrice = 299.00
    subscriptionExpiresAt = (Get-Date).AddYears(1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/businesses/$businessId/subscription" -Method Put -Body $subBody -Headers $superHeaders
Write-Host "[SUCCESS] Business subscription activated via SuperAdmin." -ForegroundColor Green

# 2. Create Branch, Cashier, Category, and Product for Low Stock Test
Write-Host "`n[2] Creating entities for low stock checkout..." -ForegroundColor Yellow

# Create Branch
$branchRes = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body (@{ name = "North Branch"; address = "789 North St"; phone = "555-0211" } | ConvertTo-Json) -Headers $ownerHeaders
$branchId = $branchRes.id
Write-Host "Created Branch: $branchId" -ForegroundColor Gray

# Create Cashier
$cashierEmail = "cashier_notif_$emailSuffix@example.com"
$staffBody = @{
    firstName = "Jane"
    lastName = "Cashier"
    email = $cashierEmail
    password = "Password123!"
    role = "Cashier"
    branchId = $branchId
} | ConvertTo-Json
$staffRes = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $staffBody -Headers $ownerHeaders
Write-Host "Created Cashier: $cashierEmail" -ForegroundColor Gray

# Login as Cashier
$cashierLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{ email = $cashierEmail; password = "Password123!" } | ConvertTo-Json) -Headers $headers
$cashierToken = $cashierLogin.token
$cashierHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $cashierToken"
}

# Create Category
$catRes = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Post -Body (@{ name = "NotifCat"; description = "Notifications Category" } | ConvertTo-Json) -Headers $ownerHeaders
$categoryId = $catRes.id

# Create Product (with initial stock: 10, min stock: 5)
$prodBody = @{
    name = "Alert Product"
    sku = "ALT-SKU-$emailSuffix"
    barcode = "ALT-BARCODE-$emailSuffix"
    description = "Notification Alert Product"
    price = 50.00
    costPrice = 30.00
    categoryId = $categoryId
    initialStocks = @(
        @{ branchId = $branchId; quantity = 10; minStockLevel = 5 }
    )
} | ConvertTo-Json

$prodRes = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $prodBody -Headers $ownerHeaders
$productId = $prodRes.id
Write-Host "Created Product ID: $productId (Quantity: 10, Min Level: 5)" -ForegroundColor Gray

# 3. Perform Checkout that triggers Low Stock Alert
Write-Host "`n[3] Performing Checkout of 6 units (Stock drops from 10 to 4)..." -ForegroundColor Yellow

$checkoutBody = @{
    items = @(
        @{ productId = $productId; quantity = 6; unitPrice = 50.00; discountAmount = 0.00 }
    )
    discountAmount = 0.00
    taxAmount = 0.00
    paymentMethod = "Cash"
} | ConvertTo-Json

$saleRes = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $checkoutBody -Headers $cashierHeaders
$saleId = $saleRes.id
Write-Host "Checkout complete. Sale ID: $saleId" -ForegroundColor Gray

# Wait to write
Start-Sleep -Seconds 1

# Query notifications as Owner
$notifications = Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method Get -Headers $ownerHeaders

$lowStockNotif = $notifications | Where-Object { $_.type -eq "LowStock" -and $_.isRead -eq $false }
if ($null -eq $lowStockNotif) {
    Write-Host "[ERROR] LowStock notification alert not found." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] LowStock notification verified: '$($lowStockNotif.title)'" -ForegroundColor Green
Write-Host "Notification Message: $($lowStockNotif.message)" -ForegroundColor Gray

# 4. Mark Notification as Read
Write-Host "`n[4] Marking LowStock notification as Read..." -ForegroundColor Yellow
$notifId = $lowStockNotif.id
$readRes = Invoke-RestMethod -Uri "$baseUrl/api/notifications/$notifId/read" -Method Put -Headers $ownerHeaders
Write-Host "Read Response: $($readRes.message)" -ForegroundColor Gray

$updatedNotifications = Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method Get -Headers $ownerHeaders
$readNotif = $updatedNotifications | Where-Object { $_.id -eq $notifId }
if ($readNotif.isRead -ne $true) {
    Write-Host "[ERROR] Notification was not marked as read." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Notification status updated to Read successfully." -ForegroundColor Green

# 5. Test Subscription Reminders (using SuperAdmin to expire subscription)
Write-Host "`n[5] Logging in as SuperAdmin to adjust subscription expiration..." -ForegroundColor Yellow

$superLogin = @{
    email = "admin@vendorapos.com"
    password = "AdminPassword123!"
} | ConvertTo-Json

$superRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $superLogin -Headers $headers
$superToken = $superRes.token
$superHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $superToken"
}

# Update business expiration date to 15 days in the future
$expiresAt = (Get-Date).AddDays(15).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$subBody = @{
    subscriptionTier = "Pro"
    subscriptionStatus = "Active"
    subscriptionPrice = 299.00
    subscriptionExpiresAt = $expiresAt
} | ConvertTo-Json

$subRes = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/businesses/$businessId/subscription" -Method Put -Body $subBody -Headers $superHeaders
Write-Host "SuperAdmin updated expiration to: $expiresAt" -ForegroundColor Gray

# Trigger reminders scan
Write-Host "`n[6] Triggering subscription reminders scan..." -ForegroundColor Yellow
$scanRes = Invoke-RestMethod -Uri "$baseUrl/api/notifications/check-subscription-reminders" -Method Post -Headers $ownerHeaders
Write-Host "Scan Response: $($scanRes.message)" -ForegroundColor Gray

# Query notifications as Owner
$notifications2 = Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method Get -Headers $ownerHeaders
$subReminderNotif = $notifications2 | Where-Object { $_.type -eq "SubscriptionReminder" }
if ($null -eq $subReminderNotif) {
    Write-Host "[ERROR] SubscriptionReminder notification alert not found." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] SubscriptionReminder notification verified: '$($subReminderNotif.title)'" -ForegroundColor Green
Write-Host "Reminder Message: $($subReminderNotif.message)" -ForegroundColor Gray

# 6. Test Spam Prevention (running scan again should not add a duplicate)
Write-Host "`n[7] Testing Subscription Reminder Spam Prevention..." -ForegroundColor Yellow
$scanRes2 = Invoke-RestMethod -Uri "$baseUrl/api/notifications/check-subscription-reminders" -Method Post -Headers $ownerHeaders

$notifications3 = Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method Get -Headers $ownerHeaders
$allSubReminders = $notifications3 | Where-Object { $_.type -eq "SubscriptionReminder" }
$remindersCount = @($allSubReminders).Count
Write-Host "Found $remindersCount SubscriptionReminder(s) in database." -ForegroundColor Gray
if ($remindersCount -ne 1) {
    Write-Host "[ERROR] Duplicate reminder notification was sent! Spam prevention failed." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Spam prevention successfully blocked duplicate alerts." -ForegroundColor Green

# 7. Test Role Isolation
Write-Host "`n[8] Testing Role Isolation on subscription reminders scan..." -ForegroundColor Yellow
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/notifications/check-subscription-reminders" -Method Post -Headers $cashierHeaders
    Write-Host "[ERROR] Cashier was allowed to trigger subscription reminders scan!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Cashier access to reminders scan is correctly forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cashier access: $statusCode" -ForegroundColor Red; Exit 1
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ALL NOTIFICATIONS SYSTEM INTEGRATION TESTS PASSED!"          -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
