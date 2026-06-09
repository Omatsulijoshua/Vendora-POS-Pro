# verify_phase12.ps1
# Integration test script for Phase 12 - Business Owner Dashboard (Multi-Business & Multi-Branch Analytics)

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 12 OWNER DASHBOARD VERIFICATION"   -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Login as Platform Admin (SuperAdmin)
Write-Host "`n[1/7] Logging in as default SuperAdmin..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@vendorapos.com"
    password = "AdminPassword123!"
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -Headers $headers -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] SuperAdmin login failed. Make sure Web API is running." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
$superToken = $res.token
Write-Host "[SUCCESS] SuperAdmin Logged in successfully." -ForegroundColor Green

# 2. Register a new Business Owner (Oliver)
$emailSuffix = Get-Random
$ownerEmail = "oliver_stats_$emailSuffix@example.com"
$ownerPassword = "Password123!"
Write-Host "`n[2/7] Registering a new Business Owner ($ownerEmail)..." -ForegroundColor Yellow

$registerBody = @{
    firstName = "Oliver"
    lastName = "Owner"
    email = $ownerEmail
    password = $ownerPassword
    businessName = "Oliver Bakery $emailSuffix"
    subdomain = "olibakery$emailSuffix"
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri "$baseUrl/api/auth/register-owner" -Method Post -Body $registerBody -Headers $headers
$ownerToken = $res.token
$bakeryId = $res.businessId
Write-Host "[SUCCESS] Registered Owner. Bakery Business ID: $bakeryId" -ForegroundColor Green

$ownerHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ownerToken"
}

# Oliver creates second business: Oliver's Cafe
$cafeBody = @{
    name = "Oliver Cafe $emailSuffix"
    subdomain = "olicafe$emailSuffix"
} | ConvertTo-Json
$cafe = Invoke-RestMethod -Uri "$baseUrl/api/businesses" -Method Post -Body $cafeBody -Headers $ownerHeaders
$cafeId = $cafe.id
Write-Host "[SUCCESS] Created Second Business: Oliver Cafe. ID: $cafeId" -ForegroundColor Green

# 3. Create Branches and Cashiers for both businesses
Write-Host "`n[3/7] Setting up branch locations and staff..." -ForegroundColor Yellow

# Switch back to Bakery to add branch and cashier
$switchBakery = Invoke-RestMethod -Uri "$baseUrl/api/auth/switch-business/$bakeryId" -Method Post -Headers $ownerHeaders
$bakeryToken = $switchBakery.token
$bakeryHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $bakeryToken"
}

$branchBakeryBody = @{ name = "Oliver Bakery Branch"; address = "101 Bakery Rd"; phone = "555-1111" } | ConvertTo-Json
$branchBakery = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body $branchBakeryBody -Headers $bakeryHeaders
$bakeryBranchId = $branchBakery.id

$cathyEmail = "cathy_bakery_$emailSuffix@example.com"
$cathyBody = @{ firstName = "Cathy"; lastName = "Cashier"; email = $cathyEmail; password = "Password123!"; role = "Cashier"; branchId = $bakeryBranchId } | ConvertTo-Json
$cathyUser = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $cathyBody -Headers $bakeryHeaders
Write-Host "[SUCCESS] Created Bakery Branch and Cashier Cathy." -ForegroundColor Green

# Create Bakery Product (Bread)
$catBakeryBody = @{ name = "Food"; description = "Eats" } | ConvertTo-Json
$catBakery = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Post -Body $catBakeryBody -Headers $bakeryHeaders
$catBakeryId = $catBakery.id

$prodBakeryBody = @{
    name = "Bread"
    sku = "BRD-99"
    price = 5.00
    costPrice = 2.00
    categoryId = $catBakeryId
    initialStocks = @(@{ branchId = $bakeryBranchId; quantity = 100; minStockLevel = 5 })
} | ConvertTo-Json
$prodBakery = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $prodBakeryBody -Headers $bakeryHeaders
$bakeryProductId = $prodBakery.id


# Switch to Cafe to add branch and cashier
$switchCafe = Invoke-RestMethod -Uri "$baseUrl/api/auth/switch-business/$cafeId" -Method Post -Headers $ownerHeaders
$cafeToken = $switchCafe.token
$cafeHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $cafeToken"
}

$branchCafeBody = @{ name = "Oliver Cafe Branch"; address = "202 Cafe St"; phone = "555-2222" } | ConvertTo-Json
$branchCafe = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body $branchCafeBody -Headers $cafeHeaders
$cafeBranchId = $branchCafe.id

$charlieEmail = "charlie_cafe_$emailSuffix@example.com"
$charlieBody = @{ firstName = "Charlie"; lastName = "Cashier"; email = $charlieEmail; password = "Password123!"; role = "Cashier"; branchId = $cafeBranchId } | ConvertTo-Json
$charlieUser = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $charlieBody -Headers $cafeHeaders
Write-Host "[SUCCESS] Created Cafe Branch and Cashier Charlie." -ForegroundColor Green

# Create Cafe Product (Coffee)
$catCafeBody = @{ name = "Beverages"; description = "Drinks" } | ConvertTo-Json
$catCafe = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Post -Body $catCafeBody -Headers $cafeHeaders
$catCafeId = $catCafe.id

$prodCafeBody = @{
    name = "Coffee"
    sku = "COF-01"
    price = 4.00
    costPrice = 1.00
    categoryId = $catCafeId
    initialStocks = @(@{ branchId = $cafeBranchId; quantity = 100; minStockLevel = 5 })
} | ConvertTo-Json
$prodCafe = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $prodCafeBody -Headers $cafeHeaders
$cafeProductId = $prodCafe.id


# 4. Cathy processes a Bakery sale (2 Bread, total $10.00 + tax $0.80 = $10.80)
Write-Host "`n[4/7] Logging in as Cathy and checking out Bakery sale..." -ForegroundColor Yellow
$cathyLoginBody = @{ email = $cathyEmail; password = "Password123!" } | ConvertTo-Json
$cathyRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $cathyLoginBody -Headers $headers
$cathyToken = $cathyRes.token
$cathyHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $cathyToken" }

$saleBody1 = @{
    paymentMethod = "Cash"
    discountAmount = 0.00
    taxAmount = 0.80
    items = @(@{ productId = $bakeryProductId; quantity = 2; unitPrice = 5.00; discountAmount = 0.00 })
} | ConvertTo-Json
$sale1 = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $saleBody1 -Headers $cathyHeaders
Write-Host "[SUCCESS] Cathy completed Bakery Sale. Total paid: $10.80" -ForegroundColor Green

# 5. Charlie processes a Cafe sale (3 Coffee, total $12.00 + tax $0.96 = $12.96)
Write-Host "`n[5/7] Logging in as Charlie and checking out Cafe sale..." -ForegroundColor Yellow
$charlieLoginBody = @{ email = $charlieEmail; password = "Password123!" } | ConvertTo-Json
$charlieRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $charlieLoginBody -Headers $headers
$charlieToken = $charlieRes.token
$charlieHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $charlieToken" }

$saleBody2 = @{
    paymentMethod = "POS"
    discountAmount = 0.00
    taxAmount = 0.96
    items = @(@{ productId = $cafeProductId; quantity = 3; unitPrice = 4.00; discountAmount = 0.00 })
} | ConvertTo-Json
$sale2 = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $saleBody2 -Headers $charlieHeaders
Write-Host "[SUCCESS] Charlie completed Cafe Sale. Total paid: $12.96" -ForegroundColor Green


# 6. Verify Owner Cross-Business Stats (Oliver)
Write-Host "`n[6/7] Verifying Oliver's cross-business stats..." -ForegroundColor Yellow

# Oliver's current JWT token is bound to Cafe (from $switchCafe)
$cafeOwnerHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $cafeToken"
}

# Fetch Stats (uses Cafe as active business)
$stats = Invoke-RestMethod -Uri "$baseUrl/api/businesses/owner-stats" -Method Get -Headers $cafeOwnerHeaders

Write-Host "  - Scoped Context Revenue: $($stats.totalRevenue) (Expected: 12.96)" -ForegroundColor Gray
Write-Host "  - Scoped Context Profit : $($stats.totalProfit) (Expected: 9.00)" -ForegroundColor Gray
Write-Host "  - Scoped Sales Count    : $($stats.totalSalesCount) (Expected: 1)" -ForegroundColor Gray

# Scoped calculations verify
if ($stats.totalRevenue -ne 12.96 -or $stats.totalProfit -ne 9.00 -or $stats.totalSalesCount -ne 1) {
    Write-Host "[ERROR] Scoped Cafe context metrics mismatch." -ForegroundColor Red; Exit 1
}

# Cross-Business metrics verify
Write-Host "  - Verifying Cross-Business Metrics..." -ForegroundColor Gray
if ($stats.businessMetrics.Count -ne 2) {
    Write-Host "[ERROR] BusinessMetrics count should be 2." -ForegroundColor Red; Exit 1
}

$bakeryMetric = $stats.businessMetrics | Where-Object { $_.businessId -eq $bakeryId }
$cafeMetric = $stats.businessMetrics | Where-Object { $_.businessId -eq $cafeId }

Write-Host "    * Bakery Revenue: $($bakeryMetric.revenue) (Expected: 10.80)" -ForegroundColor Gray
Write-Host "    * Bakery Profit : $($bakeryMetric.profit) (Expected: 6.00)" -ForegroundColor Gray
Write-Host "    * Cafe Revenue  : $($cafeMetric.revenue) (Expected: 12.96)" -ForegroundColor Gray
Write-Host "    * Cafe Profit   : $($cafeMetric.profit) (Expected: 9.00)" -ForegroundColor Gray

if ($bakeryMetric.revenue -ne 10.80 -or $bakeryMetric.profit -ne 6.00 -or $cafeMetric.revenue -ne 12.96 -or $cafeMetric.profit -ne 9.00) {
    Write-Host "[ERROR] Business metrics mismatch." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Cross-Business analytics verified successfully!" -ForegroundColor Green


# 7. Verify Branch Stats Scoping
Write-Host "`n[7/7] Verifying branch-scoping parameters..." -ForegroundColor Yellow

# Query stats passing bakeryId parameter explicitly
$bakeryStats = Invoke-RestMethod -Uri "$baseUrl/api/businesses/owner-stats?businessId=$bakeryId" -Method Get -Headers $cafeOwnerHeaders

Write-Host "  - Scoped Bakery Revenue: $($bakeryStats.totalRevenue) (Expected: 10.80)" -ForegroundColor Gray
Write-Host "  - Scoped Bakery Profit : $($bakeryStats.totalProfit) (Expected: 6.00)" -ForegroundColor Gray
Write-Host "  - Bakery Branch Revenue: $($bakeryStats.branchMetrics[0].revenue) (Expected: 10.80)" -ForegroundColor Gray
Write-Host "  - Bakery Top Product   : $($bakeryStats.topProducts[0].productName) (Expected: Bread)" -ForegroundColor Gray

if ($bakeryStats.totalRevenue -ne 10.80 -or $bakeryStats.totalProfit -ne 6.00) {
    Write-Host "[ERROR] Scoped Bakery metrics query parameter parameter failed." -ForegroundColor Red; Exit 1
}
if ($bakeryStats.branchMetrics[0].revenue -ne 10.80 -or $bakeryStats.topProducts[0].productName -ne "Bread") {
    Write-Host "[ERROR] Scoped Bakery branch/products metrics mismatch." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Branch-level scoping and comparison metrics verified successfully!" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ALL PHASE 12 OWNER DASHBOARD INTEGRATION TESTS PASSED!"   -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
