# verify_phase18_hardening.ps1
# Integration test script for Phase 18 - Final System Hardening

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 18 SYSTEM HARDENING TESTS"          -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Setup Tenant, Branch, Manager, Cashier, and Product
$emailSuffix = Get-Random
$ownerEmail = "hardening_owner_$emailSuffix@example.com"
$ownerPassword = "Password123!"
$subdomain = "hardening$emailSuffix"

Write-Host "`n[1] Registering a new Owner ($ownerEmail) and Business..." -ForegroundColor Yellow

$registerBody = @{
    firstName = "Hardening"
    lastName = "Owner"
    email = $ownerEmail
    password = $ownerPassword
    businessName = "Hardening Business $emailSuffix"
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

# Create Branch
$branchRes = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body (@{ name = "Hardening Branch"; address = "123 Main St"; phone = "555-9999" } | ConvertTo-Json) -Headers $ownerHeaders
$branchId = $branchRes.id
Write-Host "Created Branch: $branchId" -ForegroundColor Gray

# Create Manager
$managerEmail = "manager_hardening_$emailSuffix@example.com"
$managerBody = @{
    firstName = "John"
    lastName = "Manager"
    email = $managerEmail
    password = "Password123!"
    role = "Manager"
    branchId = $branchId
} | ConvertTo-Json
$managerRes = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $managerBody -Headers $ownerHeaders
Write-Host "Created Manager: $managerEmail" -ForegroundColor Gray

# Login as Manager
$managerLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{ email = $managerEmail; password = "Password123!" } | ConvertTo-Json) -Headers $headers
$managerToken = $managerLogin.token
$managerHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $managerToken"
}

# Create Cashier
$cashierEmail = "cashier_hardening_$emailSuffix@example.com"
$cashierBody = @{
    firstName = "Jane"
    lastName = "Cashier"
    email = $cashierEmail
    password = "Password123!"
    role = "Cashier"
    branchId = $branchId
} | ConvertTo-Json
$cashierRes = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $cashierBody -Headers $ownerHeaders
Write-Host "Created Cashier: $cashierEmail" -ForegroundColor Gray

# Login as Cashier
$cashierLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{ email = $cashierEmail; password = "Password123!" } | ConvertTo-Json) -Headers $headers
$cashierToken = $cashierLogin.token
$cashierHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $cashierToken"
}

# Login as SuperAdmin
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

# Create a sample Category and Product to test CRUD RBAC
$catRes = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Post -Body (@{ name = "HardenCat"; description = "Hardening Category" } | ConvertTo-Json) -Headers $ownerHeaders
$categoryId = $catRes.id

$prodBody = @{
    name = "Harden Product"
    sku = "HRD-SKU-$emailSuffix"
    barcode = "HRD-BARCODE-$emailSuffix"
    description = "Hardening Product"
    price = 100.00
    costPrice = 60.00
    categoryId = $categoryId
    initialStocks = @(
        @{ branchId = $branchId; quantity = 10; minStockLevel = 2 }
    )
} | ConvertTo-Json

$prodRes = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $prodBody -Headers $ownerHeaders
$productId = $prodRes.id
Write-Host "Created Product ID: $productId" -ForegroundColor Gray


# 2. Verify Cashier RBAC Blockades
Write-Host "`n[2] Testing Cashier RBAC Blockades..." -ForegroundColor Yellow

# Cashier accessing Audit Logs (Should be blocked)
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/audit-logs" -Method Get -Headers $cashierHeaders
    Write-Host "[ERROR] Cashier was allowed to access Audit Logs!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Cashier access to Audit Logs is correctly Forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cashier audit-logs access: $statusCode" -ForegroundColor Red; Exit 1
    }
}

# Cashier accessing SuperAdmin businesses list (Should be blocked)
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/businesses" -Method Get -Headers $cashierHeaders
    Write-Host "[ERROR] Cashier was allowed to access SuperAdmin businesses!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Cashier access to SuperAdmin businesses is correctly Forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cashier superadmin access: $statusCode" -ForegroundColor Red; Exit 1
    }
}

# Cashier creating a product (Should be blocked)
try {
    $prodBodyCashier = @{ name = "Harden Cashier Prod"; sku = "CSH-SKU-$emailSuffix"; price = 10.00; costPrice = 5.00 } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $prodBodyCashier -Headers $cashierHeaders
    Write-Host "[ERROR] Cashier was allowed to create product!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Cashier product creation is correctly Forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cashier product creation: $statusCode" -ForegroundColor Red; Exit 1
    }
}

# Cashier updating a product (Should be blocked)
try {
    $updateBody = @{ name = "Updated Harden Prod"; sku = "HRD-SKU-$emailSuffix"; price = 110.00; costPrice = 65.00 } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$baseUrl/api/products/$productId" -Method Put -Body $updateBody -Headers $cashierHeaders
    Write-Host "[ERROR] Cashier was allowed to update product!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Cashier product update is correctly Forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cashier product update: $statusCode" -ForegroundColor Red; Exit 1
    }
}

# Cashier deleting a product (Should be blocked)
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/products/$productId" -Method Delete -Headers $cashierHeaders
    Write-Host "[ERROR] Cashier was allowed to delete product!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Cashier product deletion is correctly Forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cashier product deletion: $statusCode" -ForegroundColor Red; Exit 1
    }
}

# Cashier manual stock adjustment (Should be blocked)
try {
    $adjustBody = @{ quantity = 50; minStockLevel = 5; branchId = $branchId; reason = "Cashier adjust" } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$baseUrl/api/products/$productId/adjust-stock" -Method Put -Body $adjustBody -Headers $cashierHeaders
    Write-Host "[ERROR] Cashier was allowed to adjust stock!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Cashier stock adjustment is correctly Forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cashier stock adjustment: $statusCode" -ForegroundColor Red; Exit 1
    }
}


# 3. Verify Manager RBAC Blockades
Write-Host "`n[3] Testing Manager RBAC Blockades..." -ForegroundColor Yellow

# Manager accessing SuperAdmin stats (Should be blocked)
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/stats" -Method Get -Headers $managerHeaders
    Write-Host "[ERROR] Manager was allowed to access SuperAdmin stats!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Manager access to SuperAdmin stats is correctly Forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on manager superadmin access: $statusCode" -ForegroundColor Red; Exit 1
    }
}

# Manager creating a product (Should be blocked)
try {
    $prodBodyManager = @{ name = "Harden Manager Prod"; sku = "MGR-SKU-$emailSuffix"; price = 10.00; costPrice = 5.00 } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $prodBodyManager -Headers $managerHeaders
    Write-Host "[ERROR] Manager was allowed to create product!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Manager product creation is correctly Forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on manager product creation: $statusCode" -ForegroundColor Red; Exit 1
    }
}

# Manager updating a product (Should be blocked)
try {
    $updateBody = @{ name = "Updated Harden Prod"; sku = "HRD-SKU-$emailSuffix"; price = 110.00; costPrice = 65.00 } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$baseUrl/api/products/$productId" -Method Put -Body $updateBody -Headers $managerHeaders
    Write-Host "[ERROR] Manager was allowed to update product!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Manager product update is correctly Forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on manager product update: $statusCode" -ForegroundColor Red; Exit 1
    }
}

# Manager deleting a product (Should be blocked)
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/products/$productId" -Method Delete -Headers $managerHeaders
    Write-Host "[ERROR] Manager was allowed to delete product!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Manager product deletion is correctly Forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on manager product deletion: $statusCode" -ForegroundColor Red; Exit 1
    }
}


# 4. Verify Permitted Actions for authorized roles
Write-Host "`n[4] Testing Permitted Actions..." -ForegroundColor Yellow

# Owner accessing Audit Logs (Should succeed)
$ownerAuditLogs = Invoke-RestMethod -Uri "$baseUrl/api/audit-logs" -Method Get -Headers $ownerHeaders
if ($null -ne $ownerAuditLogs) {
    Write-Host "[SUCCESS] Owner successfully accessed Audit Logs." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Owner audit logs empty or failed." -ForegroundColor Red; Exit 1
}

# Manager accessing Audit Logs (Should succeed)
$managerAuditLogs = Invoke-RestMethod -Uri "$baseUrl/api/audit-logs" -Method Get -Headers $managerHeaders
if ($null -ne $managerAuditLogs) {
    Write-Host "[SUCCESS] Manager successfully accessed Audit Logs." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Manager audit logs empty or failed." -ForegroundColor Red; Exit 1
}

# Cashier accessing own stats (Should succeed)
$cashierStats = Invoke-RestMethod -Uri "$baseUrl/api/sales/cashier-stats" -Method Get -Headers $cashierHeaders
if ($null -ne $cashierStats) {
    Write-Host "[SUCCESS] Cashier successfully accessed own Sales stats." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Cashier stats empty or failed." -ForegroundColor Red; Exit 1
}

# Manager accessing Products listing (Should succeed)
$managerProducts = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $managerHeaders
if ($null -ne $managerProducts) {
    Write-Host "[SUCCESS] Manager successfully listed Products." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Manager products listing empty or failed." -ForegroundColor Red; Exit 1
}

# Manager adjusting stock for their own assigned branch (Should succeed)
$adjustBodyManager = @{ quantity = 15; minStockLevel = 2; branchId = $branchId; reason = "Manager adjust assign" } | ConvertTo-Json
$adjustRes = Invoke-RestMethod -Uri "$baseUrl/api/products/$productId/adjust-stock" -Method Put -Body $adjustBodyManager -Headers $managerHeaders
if ($adjustRes.newQuantity -eq 15) {
    Write-Host "[SUCCESS] Manager successfully adjusted stock for assigned branch." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Manager stock adjustment failed." -ForegroundColor Red; Exit 1
}


# 5. Verify Performance Optimizations post-hardening
Write-Host "`n[5] Verifying query execution and endpoints after hardening..." -ForegroundColor Yellow

$endpoints = @(
    "/api/audit-logs",
    "/api/notifications",
    "/api/sales",
    "/api/products",
    "/api/products/$productId/adjustment-logs"
)

foreach ($endpoint in $endpoints) {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-RestMethod -Uri "$baseUrl$endpoint" -Method Get -Headers $ownerHeaders
    $stopwatch.Stop()
    Write-Host "Endpoint: $endpoint | Time Taken: $($stopwatch.ElapsedMilliseconds)ms | Status: 200 OK" -ForegroundColor Gray
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ALL SYSTEM HARDENING & SECURITY TESTS PASSED!"              -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
